import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/useBudgetData";
import { cn } from "@/lib/utils";
import { Category } from "@/types/budget";

const colorOptions = [
  { value: "dairy", label: "Blå", className: "bg-category-dairy" },
  { value: "produce", label: "Grønn", className: "bg-category-produce" },
  { value: "meat", label: "Rød", className: "bg-category-meat" },
  { value: "dry", label: "Gul", className: "bg-category-dry" },
  { value: "snacks", label: "Lilla", className: "bg-category-snacks" },
  { value: "other", label: "Grå", className: "bg-category-other" },
];

export function CategorySection() {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [reassignToId, setReassignToId] = useState<string>("");
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("other");
  const [isCreating, setIsCreating] = useState(false);

  const { data: categories } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  // All categories are now editable - no separation between default and custom
  const allCategories = categories || [];

  const handleCreate = async () => {
    if (!newName.trim()) return;
    
    await createCategory.mutateAsync({
      name: newName.trim(),
      color: newColor,
    });
    
    setNewName("");
    setNewColor("other");
    setIsCreating(false);
  };

  const handleUpdate = async () => {
    if (!editingCategory || !newName.trim()) return;
    
    await updateCategory.mutateAsync({
      id: editingCategory.id,
      name: newName.trim(),
      color: newColor,
    });
    
    setEditingCategory(null);
    setNewName("");
    setNewColor("other");
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    
    await deleteCategory.mutateAsync({
      categoryId: deletingCategory.id,
      reassignToId: reassignToId || null,
    });
    
    setDeletingCategory(null);
    setReassignToId("");
  };

  const startEditing = (category: Category) => {
    setEditingCategory(category);
    setNewName(category.name);
    setNewColor(category.color);
    setIsCreating(false);
  };

  const startCreating = () => {
    setIsCreating(true);
    setEditingCategory(null);
    setNewName("");
    setNewColor("other");
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setIsCreating(false);
    setNewName("");
    setNewColor("other");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Kategorier</Label>
        {!isCreating && !editingCategory && (
          <Button variant="ghost" size="sm" onClick={startCreating} className="h-6 text-xs gap-1">
            <Plus className="h-3 w-3" />
            Ny kategori
          </Button>
        )}
      </div>
      
      {/* All Categories */}
      <div className="space-y-1">
        {allCategories.map((category) => (
          <div
            key={category.id}
            className={cn(
              "flex items-center gap-2 p-2 rounded-md border transition-colors",
              editingCategory?.id === category.id
                ? "border-primary bg-primary/5"
                : "bg-card hover:bg-accent/50"
            )}
          >
            {editingCategory?.id === category.id ? (
              <div className="flex-1 space-y-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Kategorinavn"
                  className="h-8 text-sm"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Farge:</span>
                  <div className="flex gap-1">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setNewColor(color.value)}
                        className={cn(
                          "w-5 h-5 rounded-full transition-all",
                          color.className,
                          newColor === color.value
                            ? "ring-2 ring-offset-1 ring-primary"
                            : "opacity-50 hover:opacity-100"
                        )}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 text-xs" onClick={handleUpdate} disabled={updateCategory.isPending}>
                    {updateCategory.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                    Lagre
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={cancelEdit}>
                    Avbryt
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div
                  className={cn(
                    "w-2.5 h-2.5 rounded-full shrink-0",
                    colorOptions.find((c) => c.value === category.color)?.className || "bg-category-other"
                  )}
                />
                <span className="flex-1 text-sm">{category.name}</span>
                <div className="flex gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => startEditing(category)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  {allCategories.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => setDeletingCategory(category)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Create New Category Form */}
      {isCreating && (
        <div className="p-2 rounded-md border border-primary bg-primary/5 space-y-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ny kategorinavn"
            className="h-8 text-sm"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Farge:</span>
            <div className="flex gap-1">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setNewColor(color.value)}
                  className={cn(
                    "w-5 h-5 rounded-full transition-all",
                    color.className,
                    newColor === color.value
                      ? "ring-2 ring-offset-1 ring-primary"
                      : "opacity-50 hover:opacity-100"
                  )}
                  title={color.label}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-xs" onClick={handleCreate} disabled={createCategory.isPending || !newName.trim()}>
              {createCategory.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              Opprett
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={cancelEdit}>
              Avbryt
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slette kategori "{deletingCategory?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Velg hvilken kategori eksisterende varer skal flyttes til:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Select value={reassignToId} onValueChange={setReassignToId}>
            <SelectTrigger>
              <SelectValue placeholder="Velg kategori..." />
            </SelectTrigger>
            <SelectContent>
              {categories
                ?.filter((c) => c.id !== deletingCategory?.id)
                .map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={!reassignToId || deleteCategory.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCategory.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              Slett og flytt
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
