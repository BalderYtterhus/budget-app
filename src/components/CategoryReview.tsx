import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCategories, useUpdateItemCategory } from "@/hooks/useBudgetData";
import { useHousehold } from "@/contexts/HouseholdContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNOK } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";

interface ReviewableItem {
  id: string;
  raw_text: string;
  price: number;
  needs_review: boolean;
  category_id: string | null;
  confidence: number | null;
  receipt: {
    store_name: string | null;
    receipt_date: string;
  };
  category: {
    id: string;
    name: string;
  } | null;
}

function useItemsNeedingReview() {
  return useQuery({
    queryKey: ["items-needing-review"],
    queryFn: async (): Promise<ReviewableItem[]> => {
      const { data, error } = await supabase
        .from("receipt_items")
        .select(`
          id,
          raw_text,
          price,
          needs_review,
          category_id,
          confidence,
          receipt:receipts!inner (
            store_name,
            receipt_date
          ),
          category:categories!receipt_items_category_id_fkey (id, name)
        `)
        .or("needs_review.eq.true,category_id.is.null")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []) as unknown as ReviewableItem[];
    },
  });
}

function ConfidenceBadge({ confidence }: { confidence: number | null }) {
  if (!confidence) return null;
  const pct = Math.round(confidence * 100);
  return (
    <span className={cn(
      "text-xs px-1.5 py-0.5 rounded font-mono tabular-nums shrink-0",
      confidence >= 0.85
        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        : confidence >= 0.6
        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    )}>
      {pct}%
    </span>
  );
}

export function CategoryReviewButton() {
  const { data: items = [], isLoading } = useItemsNeedingReview();
  const count = items.length;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="relative gap-2 h-9">
          <AlertCircle className="h-4 w-4" />
          <span className="hidden sm:inline text-sm">Gjennomgang</span>
          {count > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            Kategorigjennomgang
          </SheetTitle>
        </SheetHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <CheckCircle className="h-10 w-10 text-green-500" />
            <p className="font-medium">Alt er kategorisert!</p>
            <p className="text-sm text-muted-foreground">
              Ingen varer trenger gjennomgang akkurat nå.
            </p>
          </div>
        ) : (
          <ReviewList items={items} />
        )}
      </SheetContent>
    </Sheet>
  );
}

function ReviewList({ items }: { items: ReviewableItem[] }) {
  const { data: categories = [] } = useCategories();
  const updateCategory = useUpdateItemCategory();
  const { toast } = useToast();
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [selections, setSelections] = useState<Record<string, string>>({});

  const handleSave = async (item: ReviewableItem) => {
    const catId = selections[item.id] ?? item.category_id ?? "";
    if (!catId) {
      toast({ title: "Velg en kategori først", variant: "destructive" });
      return;
    }
    await updateCategory.mutateAsync({
      itemId: item.id,
      categoryId: catId,
      itemText: item.raw_text,
    });
    setSaved(prev => new Set([...prev, item.id]));
  };

  const pending = items.filter(i => !saved.has(i.id));
  const doneCount = saved.size;

  return (
    <div className="mt-4 space-y-2">
      {doneCount > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {doneCount} av {items.length} fikset
        </p>
      )}
      {pending.map(item => {
        const currentCatId = selections[item.id] ?? item.category_id ?? "";
        return (
          <div
            key={item.id}
            className="rounded-lg border bg-card p-3 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{item.raw_text}</p>
                <p className="text-xs text-muted-foreground">
                  {item.receipt.store_name || "Ukjent butikk"} · {item.receipt.receipt_date} · {formatNOK(item.price)}
                </p>
              </div>
              <ConfidenceBadge confidence={item.confidence} />
            </div>
            <div className="flex gap-2">
              <Select
                value={currentCatId || "uncategorized"}
                onValueChange={v =>
                  setSelections(prev => ({
                    ...prev,
                    [item.id]: v === "uncategorized" ? "" : v,
                  }))
                }
              >
                <SelectTrigger className="h-8 text-sm flex-1">
                  <SelectValue placeholder="Velg kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uncategorized">Ukategorisert</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="h-8 shrink-0"
                disabled={!currentCatId || updateCategory.isPending}
                onClick={() => handleSave(item)}
              >
                Lagre
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
