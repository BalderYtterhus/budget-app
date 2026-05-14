import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Category, 
  Budget, 
  Receipt, 
  SpendingSummary, 
  CategorySpending,
  ItemCategoryMapping,
  SplitRatio
} from "@/types/budget";
import { useHousehold } from "@/contexts/HouseholdContext";
import { useMonth } from "@/contexts/MonthContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSettlementContext } from "@/contexts/SettlementContext";

export function useCategories() {
  const { household } = useHousehold();
  
  return useQuery({
    queryKey: ["categories", household?.id],
    queryFn: async (): Promise<Category[]> => {
      if (!household) return [];

      // Fetch hidden default categories for this household
      const { data: hiddenData } = await supabase
        .from("hidden_default_categories")
        .select("category_id")
        .eq("household_id", household.id);
      
      const hiddenIds = new Set((hiddenData || []).map(h => h.category_id));

      // Fetch default categories and household-specific categories
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .or(`is_default.eq.true,household_id.eq.${household.id}`)
        .order("is_default", { ascending: false })
        .order("name");
      if (error) throw error;

      // Filter out hidden default categories
      return (data || []).filter(cat => !hiddenIds.has(cat.id));
    },
    enabled: !!household,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { household } = useHousehold();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      if (!household) throw new Error("No household");

      const { data, error } = await supabase
        .from("categories")
        .insert({
          name,
          color,
          is_default: false,
          household_id: household.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Kategori opprettet!" });
    },
    onError: (error) => {
      console.error("Error creating category:", error);
      toast({
        title: "Feil ved oppretting av kategori",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const { household } = useHousehold();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, name, color }: { id: string; name: string; color: string }) => {
      if (!household) throw new Error("No household");

      // First check if this is a default category
      const { data: existing, error: fetchError } = await supabase
        .from("categories")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      if (existing.is_default) {
        // For default categories, create a household-specific copy with new values
        // and reassign all references from the old default to the new household category
        const { data: newCategory, error: createError } = await supabase
          .from("categories")
          .insert({
            name,
            color,
            is_default: false,
            household_id: household.id,
          })
          .select()
          .single();

        if (createError) throw createError;

        // Reassign receipt items, mappings, and budgets to the new category
        await supabase
          .from("receipt_items")
          .update({ category_id: newCategory.id })
          .eq("category_id", id);

        await supabase
          .from("item_category_mappings")
          .update({ category_id: newCategory.id })
          .eq("category_id", id)
          .eq("household_id", household.id);

        await supabase
          .from("category_budgets")
          .update({ category_id: newCategory.id })
          .eq("category_id", id);

        await supabase
          .from("shopping_list_items")
          .update({ category_id: newCategory.id })
          .eq("category_id", id)
          .eq("household_id", household.id);

        return newCategory;
      } else {
        // For household categories, just update directly
        const { data, error } = await supabase
          .from("categories")
          .update({ name, color })
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      queryClient.invalidateQueries({ queryKey: ["spending-summary"] });
      queryClient.invalidateQueries({ queryKey: ["shopping-list"] });
      toast({ title: "Kategori oppdatert!" });
    },
    onError: (error) => {
      console.error("Error updating category:", error);
      toast({
        title: "Feil ved oppdatering av kategori",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const { household } = useHousehold();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ categoryId, reassignToId }: { categoryId: string; reassignToId: string | null }) => {
      if (!household) throw new Error("No household");

      // First check if this is a default category
      const { data: existing, error: fetchError } = await supabase
        .from("categories")
        .select("*")
        .eq("id", categoryId)
        .single();

      if (fetchError) throw fetchError;

      // Reassign any items using this category
      if (reassignToId) {
        await supabase
          .from("receipt_items")
          .update({ category_id: reassignToId })
          .eq("category_id", categoryId);

        await supabase
          .from("item_category_mappings")
          .update({ category_id: reassignToId })
          .eq("category_id", categoryId)
          .eq("household_id", household.id);

        await supabase
          .from("category_budgets")
          .update({ category_id: reassignToId })
          .eq("category_id", categoryId);

        await supabase
          .from("shopping_list_items")
          .update({ category_id: reassignToId })
          .eq("category_id", categoryId)
          .eq("household_id", household.id);
      }

      if (existing.is_default) {
        // For default categories, hide them for this household instead of deleting
        const { error: hideError } = await supabase
          .from("hidden_default_categories")
          .insert({
            household_id: household.id,
            category_id: categoryId,
          });

        if (hideError) throw hideError;
      } else {
        // For household categories, delete them
        const { error } = await supabase
          .from("categories")
          .delete()
          .eq("id", categoryId);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      queryClient.invalidateQueries({ queryKey: ["spending-summary"] });
      queryClient.invalidateQueries({ queryKey: ["shopping-list"] });
      toast({ title: "Kategori slettet!" });
    },
    onError: (error) => {
      console.error("Error deleting category:", error);
      toast({
        title: "Feil ved sletting av kategori",
        variant: "destructive",
      });
    },
  });
}

export function useCurrentBudget() {
  const { household } = useHousehold();
  const { selectedMonth, selectedYear } = useMonth();

  return useQuery({
    queryKey: ["budget", selectedMonth, selectedYear, household?.id],
    queryFn: async (): Promise<Budget | null> => {
      if (!household) return null;
      
      const { data, error } = await supabase
        .from("budgets")
        .select(`
          *,
          category_budgets (
            *,
            category:categories (*)
          )
        `)
        .eq("month", selectedMonth)
        .eq("year", selectedYear)
        .eq("household_id", household.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!household,
  });
}

export function useMonthlyReceipts() {
  const { household } = useHousehold();
  const { selectedMonth, selectedYear } = useMonth();
  const { activeSettlement } = useSettlementContext();

  const startDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString().split("T")[0];
  const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split("T")[0];

  return useQuery({
    queryKey: ["receipts", selectedMonth, selectedYear, activeSettlement?.id],
    queryFn: async (): Promise<Receipt[]> => {
      if (!activeSettlement) return [];
      
      const { data, error } = await supabase
        .from("receipts")
        .select(`
          *,
          items:receipt_items (
            *,
            category:categories (*)
          )
        `)
        .eq("settlement_id", activeSettlement.id)
        .gte("receipt_date", startDate)
        .lte("receipt_date", endDate)
        .order("receipt_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!activeSettlement,
  });
}

export function useSpendingSummary() {
  const { data: budget } = useCurrentBudget();
  const { data: receipts } = useMonthlyReceipts();
  const { data: categories } = useCategories();
  const { household } = useHousehold();
  const { selectedMonth, selectedYear } = useMonth();

  return useQuery({
    queryKey: ["spending-summary", selectedMonth, selectedYear, household?.id, budget?.id, receipts?.length],
    queryFn: async (): Promise<SpendingSummary> => {
      // Calculate total spent from included items only
      const totalSpent = receipts?.reduce((sum, r) => {
        const items = r.items ?? [];
        if (items.length === 0) {
          // No items parsed, use receipt total
          return sum + Number(r.total_amount);
        }
        // Sum only included items
        return sum + items
          .filter(item => item.included_in_totals !== false)
          .reduce((itemSum, item) => itemSum + Number(item.price), 0);
      }, 0) ?? 0;
      
      const totalBudget = budget?.total_budget ?? 0;

      // Calculate category spending (only included items)
      const categorySpending: CategorySpending[] = (categories ?? []).map((cat) => {
        const spent = receipts?.reduce((sum, receipt) => {
          const items = receipt.items ?? [];
          return sum + items
            .filter((item) => item.category_id === cat.id && item.included_in_totals !== false)
            .reduce((itemSum, item) => itemSum + Number(item.price), 0);
        }, 0) ?? 0;

        const catBudget = budget?.category_budgets?.find(
          (cb) => cb.category_id === cat.id
        )?.amount ?? 0;

        return {
          category: cat,
          spent,
          budget: catBudget,
          remaining: catBudget - spent,
          percentUsed: catBudget > 0 ? (spent / catBudget) * 100 : 0,
          isOverBudget: spent > catBudget && catBudget > 0,
        };
      });

      return {
        totalSpent,
        totalBudget,
        remaining: totalBudget - totalSpent,
        percentUsed: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
        isOverBudget: totalSpent > totalBudget && totalBudget > 0,
        categorySpending,
      };
    },
    enabled: !!categories && !!household,
  });
}

export function useItemMappings() {
  const { household } = useHousehold();

  return useQuery({
    queryKey: ["item-mappings", household?.id],
    queryFn: async (): Promise<ItemCategoryMapping[]> => {
      if (!household) return [];
      
      const { data, error } = await supabase
        .from("item_category_mappings")
        .select("*")
        .eq("household_id", household.id)
        .order("frequency", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!household,
  });
}

export function useSaveBudget() {
  const queryClient = useQueryClient();
  const { household } = useHousehold();

  return useMutation({
    mutationFn: async ({
      month,
      year,
      totalBudget,
      categoryBudgets,
    }: {
      month: number;
      year: number;
      totalBudget: number;
      categoryBudgets: { categoryId: string; amount: number }[];
    }) => {
      if (!household) throw new Error("No household selected");

      // Upsert the main budget
      const { data: budget, error: budgetError } = await supabase
        .from("budgets")
        .upsert(
          { month, year, total_budget: totalBudget, household_id: household.id },
          { onConflict: "month,year,household_id" }
        )
        .select()
        .single();

      if (budgetError) throw budgetError;

      // Upsert category budgets
      if (categoryBudgets.length > 0) {
        const { error: catError } = await supabase
          .from("category_budgets")
          .upsert(
            categoryBudgets.map((cb) => ({
              budget_id: budget.id,
              category_id: cb.categoryId,
              amount: cb.amount,
            })),
            { onConflict: "budget_id,category_id" }
          );

        if (catError) throw catError;
      }

      return budget;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget"] });
      queryClient.invalidateQueries({ queryKey: ["spending-summary"] });
    },
  });
}

// Longest-match first — mirrors the SQL backfill in migration 20260514000001
const KNOWN_CHAINS: [string, string][] = [
  ["rema 1000", "rema 1000"],
  ["coop extra", "coop extra"],
  ["coop prix", "coop prix"],
  ["coop mega", "coop mega"],
  ["coop marked", "coop marked"],
  ["obs bygg", "obs bygg"],
  ["eurospar", "eurospar"],
  ["bunnpris", "bunnpris"],
  ["kiwi", "kiwi"],
  ["meny", "meny"],
  ["spar", "spar"],
  ["joker", "joker"],
  ["extra", "extra"],
  ["obs", "obs"],
  ["oda", "oda"],
  ["prix", "prix"],
  ["coop", "coop"],
  ["lidl", "lidl"],
  ["aldi", "aldi"],
];

function deriveStoreChain(storeName: string | null): string | null {
  if (!storeName) return null;
  const lower = storeName.toLowerCase().trim();
  for (const [prefix, chain] of KNOWN_CHAINS) {
    if (lower === prefix || lower.startsWith(prefix + " ")) return chain;
  }
  // Fallback: first word of store name
  const first = lower.split(" ")[0];
  return first || null;
}

export function useSaveReceipt() {
  const queryClient = useQueryClient();
  const { household } = useHousehold();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      storeName,
      storeChain,
      totalAmount,
      receiptDate,
      imageUrl,
      rawOcrText,
      paidByUser,
      settlementId,
      label,
      items,
    }: {
      storeName: string | null;
      storeChain: string | null;
      totalAmount: number;
      receiptDate: string;
      imageUrl: string | null;
      rawOcrText: string | null;
      paidByUser: string | null;
      settlementId: string | null;
      label: string | null;
      items: {
        rawText: string;
        normalizedName?: string;
        price: number;
        quantity?: number;
        unitPrice?: number | null;
        categoryId: string | null;
        needsReview?: boolean;
      }[];
    }) => {
      if (!household) throw new Error("No household selected");

      const resolvedChain = storeChain ?? deriveStoreChain(storeName);

      const { data: receipt, error: receiptError } = await supabase
        .from("receipts")
        .insert({
          store_name: storeName,
          store_chain: resolvedChain,
          total_amount: totalAmount,
          receipt_date: receiptDate,
          image_url: imageUrl,
          raw_ocr_text: rawOcrText,
          household_id: household.id,
          created_by_user: user?.id || null,
          paid_by_user: paidByUser,
          settlement_id: settlementId,
          label: label || null,
        })
        .select()
        .single();

      if (receiptError) throw receiptError;

      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from("receipt_items")
          .insert(
            items.map((item) => ({
              receipt_id: receipt.id,
              raw_text: item.rawText,
              normalized_name: item.normalizedName || null,
              price: item.price,
              quantity: item.quantity || 1,
              unit_price: item.unitPrice ?? null,
              category_id: item.categoryId,
              needs_review: item.needsReview ?? false,
            }))
          );

        if (itemsError) throw itemsError;

        // Write anonymized price data via Edge Function (consent checked server-side)
        if (resolvedChain) {
          const categoryIds = [...new Set(items.map(i => i.categoryId).filter(Boolean))] as string[];
          const { data: cats } = categoryIds.length
            ? await supabase.from("categories").select("id, name").in("id", categoryIds)
            : { data: [] };
          const catMap = new Map((cats || []).map(c => [c.id, c.name]));

          const priceRows = items
            .filter(i => i.normalizedName && i.price > 0 && i.needsReview !== true)
            .map(i => ({
              store_chain: resolvedChain,
              normalized_name: i.normalizedName!,
              category_name: i.categoryId ? (catMap.get(i.categoryId) ?? null) : null,
              price: i.price,
              unit_price: i.unitPrice ?? null,
              quantity: i.quantity || 1,
              receipt_date: receiptDate,
              confidence: (i as any).confidence ?? null,
            }));

          if (priceRows.length > 0) {
            // Best-effort — never block the receipt save if this fails
            supabase.functions.invoke("submit-price-data", { body: { rows: priceRows } })
              .catch(() => {});
          }
        }

        // Auto-learn mappings for items that were categorized (not needing review)
        const categorizedItems = items.filter(item => item.categoryId && !item.needsReview);
        for (const item of categorizedItems) {
          const pattern = item.rawText.toLowerCase().trim();
          // Try to upsert, but don't fail if it doesn't work
          await supabase
            .from("item_category_mappings")
            .upsert(
              {
                item_pattern: pattern,
                category_id: item.categoryId!,
                frequency: 1,
                household_id: household.id,
              },
              { 
                onConflict: "item_pattern,household_id",
              }
            ).then(({ error }) => {
              if (error) console.error("Failed to save auto-mapping:", error);
            });
        }
      }

      return receipt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      queryClient.invalidateQueries({ queryKey: ["spending-summary"] });
      queryClient.invalidateQueries({ queryKey: ["item-mappings"] });
    },
  });
}

export function useUpdateItemCategory() {
  const queryClient = useQueryClient();
  const { household } = useHousehold();

  return useMutation({
    mutationFn: async ({
      itemId,
      categoryId,
      itemText,
    }: {
      itemId: string;
      categoryId: string;
      itemText: string;
    }) => {
      // Update the item and clear needs_review flag
      const { error: itemError } = await supabase
        .from("receipt_items")
        .update({ category_id: categoryId, needs_review: false })
        .eq("id", itemId);

      if (itemError) throw itemError;

      // Store/update the mapping for future auto-categorization
      if (household) {
        const pattern = itemText.toLowerCase().trim();
        
        // First try to find existing mapping for this pattern
        const { data: existing } = await supabase
          .from("item_category_mappings")
          .select("id, frequency")
          .eq("item_pattern", pattern)
          .eq("household_id", household.id)
          .maybeSingle();

        if (existing) {
          // Update existing mapping with new category and increment frequency
          await supabase
            .from("item_category_mappings")
            .update({ 
              category_id: categoryId, 
              frequency: existing.frequency + 1,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
        } else {
          // Create new mapping
          await supabase
            .from("item_category_mappings")
            .insert({
              item_pattern: pattern,
              category_id: categoryId,
              frequency: 1,
              household_id: household.id,
            });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      queryClient.invalidateQueries({ queryKey: ["spending-summary"] });
      queryClient.invalidateQueries({ queryKey: ["item-mappings"] });
    },
  });
}

export function useDeleteReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (receiptId: string) => {
      const { error } = await supabase
        .from("receipts")
        .delete()
        .eq("id", receiptId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      queryClient.invalidateQueries({ queryKey: ["spending-summary"] });
    },
  });
}

export function useCopyBudgetFromPreviousMonth() {
  const queryClient = useQueryClient();
  const { household } = useHousehold();
  const { selectedMonth, selectedYear } = useMonth();

  return useMutation({
    mutationFn: async () => {
      if (!household) throw new Error("No household selected");

      // Calculate previous month
      let prevMonth = selectedMonth - 1;
      let prevYear = selectedYear;
      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear = selectedYear - 1;
      }

      // Get previous month's budget
      const { data: prevBudget, error: prevError } = await supabase
        .from("budgets")
        .select(`
          *,
          category_budgets (*)
        `)
        .eq("month", prevMonth)
        .eq("year", prevYear)
        .eq("household_id", household.id)
        .maybeSingle();

      if (prevError) throw prevError;
      if (!prevBudget) throw new Error("No budget found for previous month");

      // Create new budget for current month
      const { data: newBudget, error: newError } = await supabase
        .from("budgets")
        .upsert(
          {
            month: selectedMonth,
            year: selectedYear,
            total_budget: prevBudget.total_budget,
            household_id: household.id,
          },
          { onConflict: "month,year,household_id" }
        )
        .select()
        .single();

      if (newError) throw newError;

      // Copy category budgets
      if (prevBudget.category_budgets && prevBudget.category_budgets.length > 0) {
        const { error: catError } = await supabase
          .from("category_budgets")
          .upsert(
            prevBudget.category_budgets.map((cb: any) => ({
              budget_id: newBudget.id,
              category_id: cb.category_id,
              amount: cb.amount,
            })),
            { onConflict: "budget_id,category_id" }
          );

        if (catError) throw catError;
      }

      return newBudget;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget"] });
      queryClient.invalidateQueries({ queryKey: ["spending-summary"] });
    },
  });
}

export function useSplitRatios() {
  const { household } = useHousehold();

  return useQuery({
    queryKey: ["split-ratios", household?.id],
    queryFn: async (): Promise<SplitRatio[]> => {
      if (!household) return [];
      
      const { data, error } = await supabase
        .from("split_ratios")
        .select("*")
        .eq("household_id", household.id);
      if (error) throw error;
      return data;
    },
    enabled: !!household,
  });
}

export function useSaveSplitRatios() {
  const queryClient = useQueryClient();
  const { household } = useHousehold();

  return useMutation({
    mutationFn: async (ratios: { userId: string; ratio: number }[]) => {
      if (!household) throw new Error("No household selected");

      // Upsert all ratios
      const { error } = await supabase
        .from("split_ratios")
        .upsert(
          ratios.map(r => ({
            household_id: household.id,
            user_id: r.userId,
            ratio: r.ratio,
          })),
          { onConflict: "household_id,user_id" }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["split-ratios"] });
    },
  });
}

export function useUpdateReceipt() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      receiptId,
      updates,
    }: {
      receiptId: string;
      updates: { store_name?: string; store_chain?: string | null; receipt_date?: string; total_amount?: number; label?: string | null };
    }) => {
      const { error } = await supabase
        .from("receipts")
        .update(updates)
        .eq("id", receiptId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      queryClient.invalidateQueries({ queryKey: ["spending-summary"] });
      toast({ title: "Kvittering oppdatert" });
    },
    onError: () => {
      toast({ title: "Feil ved oppdatering", variant: "destructive" });
    },
  });
}

export function useUpdateReceiptPayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ receiptId, paidByUser }: { receiptId: string; paidByUser: string }) => {
      const { error } = await supabase
        .from("receipts")
        .update({ paid_by_user: paidByUser })
        .eq("id", receiptId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
    },
  });
}

export function useUpdateReceiptItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      itemId,
      updates,
    }: {
      itemId: string;
      updates: {
        raw_text?: string;
        price?: number;
        quantity?: number;
        unit_price?: number | null;
        category_id?: string | null;
        included_in_totals?: boolean;
        needs_review?: boolean;
      };
    }) => {
      const { error } = await supabase
        .from("receipt_items")
        .update(updates)
        .eq("id", itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      queryClient.invalidateQueries({ queryKey: ["spending-summary"] });
    },
    onError: (error) => {
      console.error("Error updating item:", error);
      toast({
        title: "Feil ved oppdatering",
        variant: "destructive",
      });
    },
  });
}

export function useRecalculateReceiptTotal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ receiptId, newTotal }: { receiptId: string; newTotal: number }) => {
      const { error } = await supabase
        .from("receipts")
        .update({ total_amount: newTotal })
        .eq("id", receiptId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      queryClient.invalidateQueries({ queryKey: ["spending-summary"] });
    },
  });
}

export function useLeaveHousehold() {
  const queryClient = useQueryClient();
  const { household } = useHousehold();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      if (!household) throw new Error("No household");
      const { error } = await supabase
        .from("household_memberships")
        .delete()
        .eq("household_id", household.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.clear();
      toast({ title: "Du har forlatt husholdningen" });
      window.location.href = "/auth";
    },
    onError: () => {
      toast({ title: "Feil ved utmelding", variant: "destructive" });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  const { household, members } = useHousehold();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!household) throw new Error("No household");

      const { error } = await supabase
        .from("household_memberships")
        .delete()
        .eq("household_id", household.id)
        .eq("user_id", userId);
      if (error) throw error;

      // Rebalance split ratios equally among remaining members
      const remaining = members.filter(m => m.user_id !== userId);
      if (remaining.length > 0) {
        const equalRatio = 100 / remaining.length;
        await supabase.from("split_ratios").upsert(
          remaining.map(m => ({
            household_id: household.id,
            user_id: m.user_id,
            ratio: equalRatio,
          })),
          { onConflict: "household_id,user_id" }
        );
        // Remove ratio entry for the removed member
        await supabase
          .from("split_ratios")
          .delete()
          .eq("household_id", household.id)
          .eq("user_id", userId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household"] });
      queryClient.invalidateQueries({ queryKey: ["split-ratios"] });
      toast({ title: "Medlem fjernet" });
    },
    onError: () => {
      toast({ title: "Feil ved fjerning av medlem", variant: "destructive" });
    },
  });
}
