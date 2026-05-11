import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingCart,
  Plus,
  Trash2,
  Minus,
  Loader2,
  Calculator,
  Edit2,
  Check,
  X,
} from "lucide-react";
import {
  useShoppingList,
  useAddShoppingListItem,
  useUpdateShoppingListItem,
  useDeleteShoppingListItem,
  useEstimatePrices,
} from "@/hooks/useShoppingList";
import { useCategories } from "@/hooks/useBudgetData";
import { formatNOK } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ShoppingListItem } from "@/types/budget";
import { StoreComparison } from "@/components/StoreComparison";

export function ShoppingList() {
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editQuantity, setEditQuantity] = useState(1);

  const { data: items = [], isLoading } = useShoppingList();
  const { data: categories } = useCategories();
  const { data: priceEstimates } = useEstimatePrices(items);

  const addItem = useAddShoppingListItem();
  const updateItem = useUpdateShoppingListItem();
  const deleteItem = useDeleteShoppingListItem();

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    await addItem.mutateAsync({
      name: newItemName,
      categoryId: newItemCategory || null,
    });

    setNewItemName("");
    setNewItemCategory("");
  };

  const handleQuantityChange = async (item: ShoppingListItem, delta: number) => {
    const newQuantity = Math.max(1, item.quantity + delta);
    await updateItem.mutateAsync({ id: item.id, quantity: newQuantity });
  };

  const startEditing = (item: ShoppingListItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditQuantity(item.quantity);
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;

    await updateItem.mutateAsync({
      id: editingId,
      name: editName,
      quantity: editQuantity,
    });

    setEditingId(null);
    setEditName("");
    setEditQuantity(1);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditQuantity(1);
  };

  // Calculate total estimated price
  const estimatedTotal = items.reduce((total, item) => {
    const unitPrice = priceEstimates?.get(item.id);
    if (unitPrice) {
      return total + unitPrice * item.quantity;
    }
    return total;
  }, 0);

  const itemsWithEstimates = items.filter((item) => priceEstimates?.has(item.id));
  const itemsWithoutEstimates = items.filter((item) => !priceEstimates?.has(item.id));

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <div className="h-5 bg-muted rounded w-32 animate-pulse" />
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6 pb-4">
          <CardTitle className="text-base sm:text-lg font-display flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Handleliste
          </CardTitle>
          {items.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {items.length} {items.length === 1 ? "vare" : "varer"}
            </span>
          )}
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
          {/* Add new item form */}
          <form onSubmit={handleAddItem} className="flex gap-2">
            <Input
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Legg til vare..."
              className="flex-1 min-h-[44px] text-base sm:text-sm"
            />
            <Select value={newItemCategory} onValueChange={(val) => setNewItemCategory(val === "none" ? "" : val)}>
              <SelectTrigger className="w-[120px] min-h-[44px]">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ingen</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="submit"
              size="icon"
              disabled={!newItemName.trim() || addItem.isPending}
              className="min-h-[44px] min-w-[44px]"
            >
              {addItem.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </form>

          {/* Shopping list items */}
          {items.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <ShoppingCart className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground mt-2">
                Handlelisten er tom
              </p>
              <p className="text-xs text-muted-foreground">
                Legg til varer du trenger å handle
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const unitPrice = priceEstimates?.get(item.id);
                const isEditing = editingId === item.id;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg border bg-card transition-colors",
                      isEditing && "ring-2 ring-primary"
                    )}
                  >
                    {isEditing ? (
                      <>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 h-8"
                          autoFocus
                        />
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditQuantity(Math.max(1, editQuantity - 1))}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm tabular-nums">
                            {editQuantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditQuantity(editQuantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary"
                          onClick={saveEdit}
                          disabled={updateItem.isPending}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={cancelEdit}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">{item.name}</p>
                            {item.category && (
                              <span
                                className={cn(
                                  "text-[10px] px-1.5 py-0.5 rounded-full shrink-0",
                                  `bg-category-${item.category.color}/20 text-category-${item.category.color}`
                                )}
                              >
                                {item.category.name}
                              </span>
                            )}
                          </div>
                          {unitPrice && (
                            <p className="text-xs text-muted-foreground">
                              ~{formatNOK(unitPrice)} per stk
                            </p>
                          )}
                        </div>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuantityChange(item, -1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm tabular-nums font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuantityChange(item, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Edit button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => startEditing(item)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>

                        {/* Delete button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteItem.mutate(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Price estimation footer */}
          {items.length > 0 && (
            <div className="pt-3 border-t space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calculator className="h-4 w-4" />
                  <span>Estimert pris</span>
                </div>
                <span className="font-semibold tabular-nums">
                  {estimatedTotal > 0 ? formatNOK(estimatedTotal) : "—"}
                </span>
              </div>
              {itemsWithoutEstimates.length > 0 && estimatedTotal > 0 && (
                <p className="text-xs text-muted-foreground">
                  {itemsWithoutEstimates.length} {itemsWithoutEstimates.length === 1 ? "vare" : "varer"} uten prishistorikk
                </p>
              )}
              {estimatedTotal === 0 && items.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Ingen prishistorikk tilgjengelig ennå
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Store price comparison */}
      {items.length > 0 && <StoreComparison items={items} />}
    </div>
  );
}
