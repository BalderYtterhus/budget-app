import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Settings, Loader2, Copy } from "lucide-react";
import { useCategories, useCurrentBudget, useSaveBudget, useCopyBudgetFromPreviousMonth } from "@/hooks/useBudgetData";
import { useToast } from "@/hooks/use-toast";
import { useMonth } from "@/contexts/MonthContext";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { CategorySection } from "@/components/CategorySection";

export function BudgetSettings() {
  const { data: categories } = useCategories();
  const { data: currentBudget } = useCurrentBudget();
  const saveBudget = useSaveBudget();
  const copyBudget = useCopyBudgetFromPreviousMonth();
  const { toast } = useToast();
  const { selectedMonth, selectedYear } = useMonth();

  const [open, setOpen] = useState(false);
  const [totalBudget, setTotalBudget] = useState("");
  const [categoryBudgets, setCategoryBudgets] = useState<
    Record<string, string>
  >({});

  const monthDate = new Date(selectedYear, selectedMonth - 1);
  const monthLabel = format(monthDate, "MMMM yyyy", { locale: nb });

  // Initialize form when data loads
  useEffect(() => {
    if (currentBudget) {
      setTotalBudget(currentBudget.total_budget.toString());
      const catBudgets: Record<string, string> = {};
      currentBudget.category_budgets?.forEach((cb) => {
        catBudgets[cb.category_id] = cb.amount.toString();
      });
      setCategoryBudgets(catBudgets);
    } else {
      setTotalBudget("");
      setCategoryBudgets({});
    }
  }, [currentBudget]);

  const handleSave = async () => {
    try {
      await saveBudget.mutateAsync({
        month: selectedMonth,
        year: selectedYear,
        totalBudget: parseFloat(totalBudget) || 0,
        categoryBudgets: Object.entries(categoryBudgets)
          .filter(([, amount]) => parseFloat(amount) > 0)
          .map(([categoryId, amount]) => ({
            categoryId,
            amount: parseFloat(amount),
          })),
      });

      toast({
        title: "Budsjett lagret!",
        description: `Budsjettet for ${monthLabel} er oppdatert.`,
      });
      setOpen(false);
    } catch {
      toast({
        title: "Feil ved lagring av budsjett",
        description: "Vennligst prøv igjen.",
        variant: "destructive",
      });
    }
  };

  const handleCopyFromPrevious = async () => {
    try {
      await copyBudget.mutateAsync();
      toast({
        title: "Budsjett kopiert!",
        description: "Budsjettet fra forrige måned er kopiert.",
      });
    } catch (error: any) {
      toast({
        title: "Kunne ikke kopiere budsjett",
        description: error.message || "Ingen budsjett funnet for forrige måned.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Budsjett
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="capitalize">Budsjett for {monthLabel}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Copy from previous month button */}
          {!currentBudget && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleCopyFromPrevious}
              disabled={copyBudget.isPending}
            >
              {copyBudget.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              Kopier fra forrige måned
            </Button>
          )}

          {/* Total Budget */}
          <div className="space-y-2">
            <Label htmlFor="total-budget" className="text-base font-semibold">
              Total månedsbudsjett
            </Label>
            <div className="relative">
              <Input
                id="total-budget"
                type="number"
                step="0.01"
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value)}
                className="text-lg pr-12"
                placeholder="5000"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                kr
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Ditt mål for matforbruk denne måneden
            </p>
          </div>

          {/* Category Budgets */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Kategorigrenser (valgfritt)
            </Label>
            <p className="text-xs text-muted-foreground">
              Sett individuelle grenser per kategori for mer presis sporing
            </p>
            <div className="space-y-3">
              {categories?.map((cat) => (
                <div key={cat.id} className="flex items-center gap-3">
                  <Label
                    htmlFor={`cat-${cat.id}`}
                    className="flex-1 text-sm"
                  >
                    {cat.name}
                  </Label>
                  <div className="relative w-28">
                    <Input
                      id={`cat-${cat.id}`}
                      type="number"
                      step="0.01"
                      value={categoryBudgets[cat.id] || ""}
                      onChange={(e) =>
                        setCategoryBudgets((prev) => ({
                          ...prev,
                          [cat.id]: e.target.value,
                        }))
                      }
                      className="text-sm pr-8"
                      placeholder="0"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                      kr
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Category Management Section */}
          <CategorySection />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Avbryt
          </Button>
          <Button onClick={handleSave} disabled={saveBudget.isPending}>
            {saveBudget.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Lagre budsjett
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
