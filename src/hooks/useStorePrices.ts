import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHousehold } from "@/contexts/HouseholdContext";
import { ShoppingListItem } from "@/types/budget";

// Normalize store names for comparison
export function normalizeStoreName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Normalize item names for matching
function normalizeItemName(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Calculate similarity between two strings (word overlap)
function calculateSimilarity(a: string, b: string): number {
  const wordsA = new Set(normalizeItemName(a).split(" "));
  const wordsB = new Set(normalizeItemName(b).split(" "));
  
  let matches = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) matches++;
  }
  
  const maxLen = Math.max(wordsA.size, wordsB.size);
  return maxLen > 0 ? matches / maxLen : 0;
}

// Check if two items match
function itemsMatch(shoppingItem: string, receiptItem: string): boolean {
  const normShopping = normalizeItemName(shoppingItem);
  const normReceipt = normalizeItemName(receiptItem);
  
  if (normShopping === normReceipt) return true;
  if (normReceipt.includes(normShopping)) return true;
  if (calculateSimilarity(normShopping, normReceipt) >= 0.6) return true;
  
  const shoppingWords = normShopping.split(" ").filter(w => w.length > 2);
  for (const word of shoppingWords) {
    if (normReceipt.includes(word)) return true;
  }
  
  return false;
}

// Calculate median of an array
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export interface StorePriceData {
  storeName: string;
  normalizedName: string;
  itemPrices: Map<string, number>; // itemId -> median unit price
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

// Hook to get all known stores from receipt history
export function useKnownStores() {
  const { household } = useHousehold();

  return useQuery({
    queryKey: ["known-stores", household?.id],
    queryFn: async (): Promise<string[]> => {
      if (!household) return [];

      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { data, error } = await supabase
        .from("receipts")
        .select("store_name")
        .eq("household_id", household.id)
        .gte("receipt_date", ninetyDaysAgo.toISOString().split("T")[0])
        .not("store_name", "is", null);

      if (error) throw error;

      // Get unique store names (normalized)
      const storeMap = new Map<string, string>();
      for (const receipt of data || []) {
        if (receipt.store_name) {
          const normalized = normalizeStoreName(receipt.store_name);
          // Keep the first (or most common) original name
          if (!storeMap.has(normalized)) {
            storeMap.set(normalized, receipt.store_name);
          }
        }
      }

      return Array.from(storeMap.values()).sort();
    },
    enabled: !!household,
    staleTime: 60000,
  });
}

// Main hook: compute store price comparison for shopping list
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

      // Fetch all receipts with items from the last 90 days
      const { data: receipts, error } = await supabase
        .from("receipts")
        .select(`
          store_name,
          items:receipt_items (
            raw_text,
            price,
            quantity,
            unit_price,
            included_in_totals
          )
        `)
        .eq("household_id", household.id)
        .gte("receipt_date", ninetyDaysAgo.toISOString().split("T")[0])
        .not("store_name", "is", null);

      if (error) throw error;

      // Build price database: storeName -> itemPattern -> prices[]
      const priceDb = new Map<string, Map<string, number[]>>();

      for (const receipt of receipts || []) {
        if (!receipt.store_name) continue;
        
        const normalizedStore = normalizeStoreName(receipt.store_name);
        
        if (!priceDb.has(normalizedStore)) {
          priceDb.set(normalizedStore, new Map());
        }
        const storeItems = priceDb.get(normalizedStore)!;

        for (const item of receipt.items || []) {
          // Skip excluded items
          if (item.included_in_totals === false) continue;

          const normalizedItem = normalizeItemName(item.raw_text);
          const quantity = item.quantity || 1;
          const unitPrice = item.unit_price ?? (Number(item.price) / quantity);

          if (!storeItems.has(normalizedItem)) {
            storeItems.set(normalizedItem, []);
          }
          storeItems.get(normalizedItem)!.push(unitPrice);
        }
      }

      // Get unique stores with their original names
      const storeNames = new Map<string, string>();
      for (const receipt of receipts || []) {
        if (receipt.store_name) {
          const normalized = normalizeStoreName(receipt.store_name);
          if (!storeNames.has(normalized)) {
            storeNames.set(normalized, receipt.store_name);
          }
        }
      }

      // Calculate estimates for each store
      const storeData: StorePriceData[] = [];

      for (const [normalizedStore, originalName] of storeNames) {
        const storeItems = priceDb.get(normalizedStore) || new Map();
        const itemPrices = new Map<string, number>();
        let totalEstimate = 0;
        let knownCount = 0;
        let unknownCount = 0;

        for (const shoppingItem of shoppingItems) {
          // Try to find matching receipt items
          const matchingPrices: number[] = [];

          for (const [receiptItem, prices] of storeItems) {
            if (itemsMatch(shoppingItem.name, receiptItem)) {
              matchingPrices.push(...prices);
            }
          }

          if (matchingPrices.length > 0) {
            const medianPrice = median(matchingPrices);
            itemPrices.set(shoppingItem.id, medianPrice);
            totalEstimate += medianPrice * shoppingItem.quantity;
            knownCount++;
          } else {
            unknownCount++;
          }
        }

        const coveragePercent = shoppingItems.length > 0 
          ? (knownCount / shoppingItems.length) * 100 
          : 0;

        storeData.push({
          storeName: originalName,
          normalizedName: normalizedStore,
          itemPrices,
          totalEstimate,
          knownItemCount: knownCount,
          unknownItemCount: unknownCount,
          coveragePercent,
        });
      }

      // Sort by total estimate (cheapest first), but only consider stores with coverage
      const storesWithCoverage = storeData
        .filter(s => s.knownItemCount > 0)
        .sort((a, b) => a.totalEstimate - b.totalEstimate);

      const cheapestStore = storesWithCoverage.length > 0 ? storesWithCoverage[0] : null;
      
      // Has enough data if at least one store has >= 50% coverage
      const hasEnoughData = storesWithCoverage.some(s => s.coveragePercent >= 50);

      return {
        stores: storesWithCoverage,
        cheapestStore,
        hasEnoughData,
      };
    },
    enabled: !!household && shoppingItems.length > 0,
    staleTime: 60000,
  });
}

// Hook for detailed per-item comparison data
export function useDetailedStoreComparison(shoppingItems: ShoppingListItem[]) {
  const { data: comparison } = useStoreComparison(shoppingItems);

  if (!comparison) {
    return null;
  }

  // Build a matrix of items x stores
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

    return {
      item,
      storePrices,
      cheapestStore,
    };
  });

  return {
    stores: comparison.stores,
    itemRows,
    cheapestStore: comparison.cheapestStore,
    hasEnoughData: comparison.hasEnoughData,
  };
}
