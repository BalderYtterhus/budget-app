import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Ban } from "lucide-react";
import { ReceiptItem, Category } from "@/types/budget";
import { formatNOK } from "@/lib/format";
import { useUpdateReceiptItem, useUpdateItemCategory } from "@/hooks/useBudgetData";
import { cn } from "@/lib/utils";

interface ReceiptItemEditorProps {
  item: ReceiptItem;
  categories: Category[];
}

export function ReceiptItemEditor({ item, categories }: ReceiptItemEditorProps) {
  const updateItem = useUpdateReceiptItem();
  const updateItemCategory = useUpdateItemCategory();
  
  const [quantity, setQuantity] = useState(item.quantity || 1);
  const [price, setPrice] = useState(Number(item.price));
  const [rawText, setRawText] = useState(item.raw_text);
  const [included, setIncluded] = useState(item.included_in_totals !== false);

  // Reset local state when item changes
  useEffect(() => {
    setQuantity(item.quantity || 1);
    setPrice(Number(item.price));
    setRawText(item.raw_text);
    setIncluded(item.included_in_totals !== false);
  }, [item.id, item.quantity, item.price, item.raw_text, item.included_in_totals]);

  const handlePriceBlur = async () => {
    if (price !== Number(item.price)) {
      await updateItem.mutateAsync({
        itemId: item.id,
        updates: { price, unit_price: quantity > 1 ? price / quantity : null },
      });
    }
  };

  const handleQuantityBlur = async () => {
    if (quantity !== (item.quantity || 1)) {
      await updateItem.mutateAsync({
        itemId: item.id,
        updates: { quantity, unit_price: quantity > 1 ? price / quantity : null },
      });
    }
  };

  const handleTextBlur = async () => {
    if (rawText !== item.raw_text) {
      await updateItem.mutateAsync({
        itemId: item.id,
        updates: { raw_text: rawText },
      });
    }
  };

  const handleIncludedChange = async (checked: boolean) => {
    setIncluded(checked);
    await updateItem.mutateAsync({
      itemId: item.id,
      updates: { included_in_totals: checked },
    });
  };

  const handleCategoryChange = async (categoryId: string) => {
    await updateItemCategory.mutateAsync({
      itemId: item.id,
      categoryId: categoryId === "uncategorized" ? "" : categoryId,
      itemText: item.raw_text,
    });
  };

  const isExcluded = !included;

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-colors",
        isExcluded && "bg-muted/50 opacity-60",
        item.needs_review && !isExcluded && "bg-warning/5 border-warning/30"
      )}
    >
      {/* Row 1: Item name + category */}
      <div className="flex items-start gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <Input
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
                onBlur={handleTextBlur}
              className={cn(
                "h-8 text-sm font-medium",
                isExcluded && "line-through text-muted-foreground"
              )}
              disabled={updateItem.isPending}
            />
            {item.needs_review && !isExcluded && (
              <AlertCircle className="h-4 w-4 text-warning shrink-0" />
            )}
            {isExcluded && (
              <Ban className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
          </div>
        </div>
        <Select
          value={item.category_id || "uncategorized"}
          onValueChange={handleCategoryChange}
          disabled={updateItemCategory.isPending}
        >
          <SelectTrigger
            className={cn(
              "w-[120px] h-8 text-xs",
              item.needs_review && !item.category_id && !isExcluded && "border-warning"
            )}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="uncategorized">Ukategorisert</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Row 2: Quantity, price, include toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Label className="text-xs text-muted-foreground shrink-0">Antall:</Label>
          <Input
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            onBlur={handleQuantityBlur}
            className="h-7 w-16 text-sm text-right"
            disabled={updateItem.isPending}
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Label className="text-xs text-muted-foreground shrink-0">Pris:</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
            onBlur={handlePriceBlur}
            className="h-7 w-20 text-sm text-right"
            disabled={updateItem.isPending}
          />
        </div>

        {quantity > 1 && (
          <span className="text-xs text-muted-foreground">
            ({formatNOK(price / quantity)} per stk)
          </span>
        )}

        <div className="flex items-center gap-1.5 ml-auto">
          <Label
            htmlFor={`include-${item.id}`}
            className={cn(
              "text-xs cursor-pointer",
              isExcluded ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {isExcluded ? "Ekskludert" : "Inkludert"}
          </Label>
          <Switch
            id={`include-${item.id}`}
            checked={included}
            onCheckedChange={handleIncludedChange}
            disabled={updateItem.isPending}
          />
        </div>
      </div>
    </div>
  );
}