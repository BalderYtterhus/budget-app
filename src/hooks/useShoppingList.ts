import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingListItem } from "@/types/budget";
import { useHousehold } from "@/contexts/HouseholdContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// Normalize text for matching: lowercase, remove extra whitespace/punctuation
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .replace(/\s+/g, " ")    // Normalize whitespace
    .trim();
}

// Calculate similarity between two strings (simple word overlap)
function calculateSimilarity(a: string, b: string): number {
  const wordsA = new Set(normalizeText(a).split(" "));
  const wordsB = new Set(normalizeText(b).split(" "));
  
  let matches = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) matches++;
  }
  
  const maxLen = Math.max(wordsA.size, wordsB.size);
  return maxLen > 0 ? matches / maxLen : 0;
}

// Check if two items match (fuzzy matching)
export function itemsMatch(shoppingItem: string, receiptItem: string): boolean {
  const normShopping = normalizeText(shoppingItem);
  const normReceipt = normalizeText(receiptItem);
  
  // Exact match
  if (normShopping === normReceipt) return true;
  
  // Contains match (shopping item name appears in receipt)
  if (normReceipt.includes(normShopping)) return true;
  
  // Word overlap similarity (>= 60% match)
  if (calculateSimilarity(normShopping, normReceipt) >= 0.6) return true;
  
  // Check if any significant word from shopping list is in receipt
  const shoppingWords = normShopping.split(" ").filter(w => w.length > 2);
  for (const word of shoppingWords) {
    if (normReceipt.includes(word)) return true;
  }
  
  return false;
}

export function useShoppingList() {
  const { household } = useHousehold();

  return useQuery({
    queryKey: ["shopping-list", household?.id],
    queryFn: async (): Promise<ShoppingListItem[]> => {
      if (!household) return [];

      const { data, error } = await supabase
        .from("shopping_list_items")
        .select(`
          *,
          category:categories (*)
        `)
        .eq("household_id", household.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!household,
  });
}

export function useAddShoppingListItem() {
  const queryClient = useQueryClient();
  const { household } = useHousehold();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      name,
      quantity = 1,
      categoryId,
    }: {
      name: string;
      quantity?: number;
      categoryId?: string | null;
    }) => {
      if (!household) throw new Error("No household");

      const { data, error } = await supabase
        .from("shopping_list_items")
        .insert({
          name: name.trim(),
          quantity,
          category_id: categoryId || null,
          household_id: household.id,
          added_by_user: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-list"] });
    },
    onError: (error) => {
      console.error("Error adding item:", error);
      toast({
        title: "Kunne ikke legge til vare",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateShoppingListItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      quantity,
      categoryId,
    }: {
      id: string;
      name?: string;
      quantity?: number;
      categoryId?: string | null;
    }) => {
      const updates: {
        name?: string;
        quantity?: number;
        category_id?: string | null;
      } = {};
      if (name !== undefined) updates.name = name.trim();
      if (quantity !== undefined) updates.quantity = quantity;
      if (categoryId !== undefined) updates.category_id = categoryId;

      const { error } = await supabase
        .from("shopping_list_items")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-list"] });
    },
    onError: (error) => {
      console.error("Error updating item:", error);
      toast({
        title: "Kunne ikke oppdatere vare",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteShoppingListItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("shopping_list_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-list"] });
    },
  });
}

export function useRemoveMatchedItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shoppingItems,
      receiptItems,
    }: {
      shoppingItems: ShoppingListItem[];
      receiptItems: Array<{ rawText: string; price: number }>;
    }) => {
      const removedNames: string[] = [];
      const itemsToRemove: string[] = [];
      const itemsToUpdate: { id: string; quantity: number }[] = [];
      
      // Track which receipt items have been matched
      const matchedReceiptIndices = new Set<number>();

      for (const shoppingItem of shoppingItems) {
        let matchCount = 0;
        
        // Find matching receipt items
        for (let i = 0; i < receiptItems.length; i++) {
          if (matchedReceiptIndices.has(i)) continue;
          
          if (itemsMatch(shoppingItem.name, receiptItems[i].rawText)) {
            matchedReceiptIndices.add(i);
            matchCount++;
            
            // Only match up to the quantity needed
            if (matchCount >= shoppingItem.quantity) break;
          }
        }

        if (matchCount > 0) {
          const newQuantity = shoppingItem.quantity - matchCount;
          
          if (newQuantity <= 0) {
            itemsToRemove.push(shoppingItem.id);
            removedNames.push(shoppingItem.name);
          } else {
            itemsToUpdate.push({ id: shoppingItem.id, quantity: newQuantity });
            removedNames.push(`${shoppingItem.name} (${matchCount})`);
          }
        }
      }

      // Execute removals
      if (itemsToRemove.length > 0) {
        await supabase
          .from("shopping_list_items")
          .delete()
          .in("id", itemsToRemove);
      }

      // Execute updates
      for (const update of itemsToUpdate) {
        await supabase
          .from("shopping_list_items")
          .update({ quantity: update.quantity })
          .eq("id", update.id);
      }

      return removedNames;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-list"] });
    },
  });
}

// Hook to estimate prices based on historical receipt data
export function useEstimatePrices(shoppingItems: ShoppingListItem[]) {
  const { household } = useHousehold();

  return useQuery({
    queryKey: ["price-estimates", household?.id, shoppingItems.map(i => i.name).join(",")],
    queryFn: async (): Promise<Map<string, number>> => {
      if (!household || shoppingItems.length === 0) return new Map();

      // Fetch all receipt items from this household (last 6 months for relevance)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: receipts, error } = await supabase
        .from("receipts")
        .select(`
          items:receipt_items (
            raw_text,
            price,
            included_in_totals
          )
        `)
        .eq("household_id", household.id)
        .gte("receipt_date", sixMonthsAgo.toISOString().split("T")[0]);

      if (error) throw error;

      // Flatten all receipt items and filter to only included items
      const allItems = receipts?.flatMap(r => r.items || [])
        .filter(item => item.included_in_totals !== false) || [];

      // Calculate price estimates for each shopping item
      const estimates = new Map<string, number>();

      for (const shoppingItem of shoppingItems) {
        const matchingPrices: number[] = [];

        for (const receiptItem of allItems) {
          if (itemsMatch(shoppingItem.name, receiptItem.raw_text)) {
            matchingPrices.push(Number(receiptItem.price));
          }
        }

        if (matchingPrices.length > 0) {
          // Use median for robustness against outliers
          matchingPrices.sort((a, b) => a - b);
          const mid = Math.floor(matchingPrices.length / 2);
          const median = matchingPrices.length % 2
            ? matchingPrices[mid]
            : (matchingPrices[mid - 1] + matchingPrices[mid]) / 2;
          
          estimates.set(shoppingItem.id, median);
        }
      }

      return estimates;
    },
    enabled: !!household && shoppingItems.length > 0,
    staleTime: 60000, // Cache for 1 minute
  });
}

export function useClearShoppingList() {
  const queryClient = useQueryClient();
  const { household } = useHousehold();

  return useMutation({
    mutationFn: async () => {
      if (!household) throw new Error("No household");
      const { error } = await supabase
        .from("shopping_list_items")
        .delete()
        .eq("household_id", household.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shopping-list"] }),
  });
}
