import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHousehold } from "@/contexts/HouseholdContext";
import { ShoppingListItem } from "@/types/budget";

// Normalize for client-side fuzzy matching only
function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/\d+([.,]\d+)?\s*(g|kg|ml|l|cl|dl|pk|stk|liter)\s*/gi, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function calculateSimilarity(a: string, b: string): number {
  const wordsA = new Set(normalizeForMatch(a).split(" ").filter(Boolean));
  const wordsB = new Set(normalizeForMatch(b).split(" ").filter(Boolean));
  let matches = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) matches++;
  }
  const maxLen = Math.max(wordsA.size, wordsB.size);
  return maxLen > 0 ? matches / maxLen : 0;
}

function itemsMatch(shoppingItem: string, normalizedName: string): boolean {
  const normShopping = normalizeForMatch(shoppingItem);
  if (normShopping === normalizedName) return true;
  if (normalizedName.includes(normShopping)) return true;
  if (calculateSimilarity(normShopping, normalizedName) >= 0.6) return true;
  for (const word of normShopping.split(" ").filter(w => w.length > 2)) {
    if (normalizedName.includes(word)) return true;
  }
  return false;
}

export interface StorePriceData {
  storeName: string;        // display name (store_chain)
  normalizedName: string;
  itemPrices: Map<string, number>;
  totalEstimate: number;
  knownItemCount: number;
  unknownItemCount: number;
  coveragePercent: number;
}

export interface StoreComparisonResult {
  stores: StorePriceData[];
  cheapestStore: StorePriceData | null;
  hasEnoughData: boolean;
}

interface PriceStatRow {
  store_chain: string;
  normalized_name: string;
  median_unit_price: number;
  sample_count: number;
  last_seen: string;
}

// Returns the distinct store chains seen in the last 90 days
export function useKnownStores() {
  const { household } = useHousehold();

  return useQuery({
    queryKey: ["known-stores", household?.id],
    queryFn: async (): Promise<string[]> => {
      if (!household) return [];

      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { data, error } = await supabase
        .from("item_price_stats")
        .select("store_chain")
        .eq("household_id", household.id)
        .gte("last_seen", ninetyDaysAgo.toISOString().split("T")[0]);

      if (error) throw error;

      const chains = [...new Set((data || []).map(r => r.store_chain).filter(Boolean))];
      return chains.sort();
    },
    enabled: !!household,
    staleTime: 60_000,
  });
}

// Main hook: compute store price comparison for a shopping list
// Queries the aggregated view — much cheaper than fetching all raw receipt rows
export function useStoreComparison(shoppingItems: ShoppingListItem[]) {
  const { household } = useHousehold();

  return useQuery({
    queryKey: ["store-comparison", household?.id, shoppingItems.map(i => `${i.id}:${i.quantity}`).join(",")],
    queryFn: async (): Promise<StoreComparisonResult> => {
      if (!household || shoppingItems.length === 0) {
        return { stores: [], cheapestStore: null, hasEnoughData: false };
      }

      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { data, error } = await supabase
        .from("item_price_stats")
        .select("store_chain, normalized_name, median_unit_price, sample_count, last_seen")
        .eq("household_id", household.id)
        .gte("last_seen", ninetyDaysAgo.toISOString().split("T")[0]);

      if (error) throw error;

      const rows = (data || []) as PriceStatRow[];

      // Group rows by store_chain
      const byChain = new Map<string, PriceStatRow[]>();
      for (const row of rows) {
        if (!byChain.has(row.store_chain)) byChain.set(row.store_chain, []);
        byChain.get(row.store_chain)!.push(row);
      }

      const storeData: StorePriceData[] = [];

      for (const [chain, chainRows] of byChain) {
        const itemPrices = new Map<string, number>();
        let totalEstimate = 0;
        let knownCount = 0;
        let unknownCount = 0;

        for (const shoppingItem of shoppingItems) {
          // Find the best matching normalized_name for this shopping list item
          let bestPrice: number | null = null;
          let bestScore = 0;

          for (const row of chainRows) {
            if (itemsMatch(shoppingItem.name, row.normalized_name)) {
              const score = calculateSimilarity(shoppingItem.name, row.normalized_name);
              if (score > bestScore) {
                bestScore = score;
                bestPrice = row.median_unit_price;
              }
            }
          }

          if (bestPrice !== null) {
            itemPrices.set(shoppingItem.id, bestPrice);
            totalEstimate += bestPrice * shoppingItem.quantity;
            knownCount++;
          } else {
            unknownCount++;
          }
        }

        const coveragePercent = shoppingItems.length > 0
          ? (knownCount / shoppingItems.length) * 100
          : 0;

        storeData.push({
          storeName: chain,
          normalizedName: chain,
          itemPrices,
          totalEstimate,
          knownItemCount: knownCount,
          unknownItemCount: unknownCount,
          coveragePercent,
        });
      }

      const storesWithCoverage = storeData
        .filter(s => s.knownItemCount > 0)
        .sort((a, b) => a.totalEstimate - b.totalEstimate);

      return {
        stores: storesWithCoverage,
        cheapestStore: storesWithCoverage[0] ?? null,
        hasEnoughData: storesWithCoverage.some(s => s.coveragePercent >= 50),
      };
    },
    enabled: !!household && shoppingItems.length > 0,
    staleTime: 60_000,
  });
}

// Hook for per-item comparison matrix (unchanged shape, consumed by StoreComparison page)
export function useDetailedStoreComparison(shoppingItems: ShoppingListItem[]) {
  const { data: comparison } = useStoreComparison(shoppingItems);
  if (!comparison) return null;

  const itemRows = shoppingItems.map(item => {
    const storePrices: Record<string, number | null> = {};
    let cheapestStore: string | null = null;
    let cheapestPrice = Infinity;

    for (const store of comparison.stores) {
      const price = store.itemPrices.get(item.id) ?? null;
      storePrices[store.normalizedName] = price;
      if (price !== null && price < cheapestPrice) {
        cheapestPrice = price;
        cheapestStore = store.normalizedName;
      }
    }

    return { item, storePrices, cheapestStore };
  });

  return {
    stores: comparison.stores,
    itemRows,
    cheapestStore: comparison.cheapestStore,
    hasEnoughData: comparison.hasEnoughData,
  };
}
