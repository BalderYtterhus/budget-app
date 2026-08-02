import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QueryErrorState } from "@/components/QueryErrorState";
import { BudgetProgress } from "./BudgetProgress";
import { useSpendingSummary } from "@/hooks/useBudgetData";
import { PieChart } from "lucide-react";
import { formatNOK } from "@/lib/format";
import { cn } from "@/lib/utils";

const colorClassMap: Record<string, string> = {
  dairy: "bg-category-dairy",
  produce: "bg-category-produce",
  meat: "bg-category-meat",
  dry: "bg-category-dry",
  snacks: "bg-category-snacks",
  other: "bg-category-other",
};

export function CategoryBreakdown() {
  const { data: summary, isLoading, isError, error, refetch } = useSpendingSummary();

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <div className="h-5 bg-muted rounded w-40 animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2 animate-pulse">
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-2 bg-muted rounded w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="shadow-card">
        <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
          <CardTitle className="text-base sm:text-lg font-display">Forbruk per kategori</CardTitle>
        </CardHeader>
        <CardContent>
          <QueryErrorState what="forbruket" error={error} onRetry={() => refetch()} />
        </CardContent>
      </Card>
    );
  }

  if (!summary) return null;

  const categoriesWithSpending = summary.categorySpending.filter(
    (cs) => cs.spent > 0 || cs.budget > 0
  );

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6 pb-4">
        <CardTitle className="text-base sm:text-lg font-display">Forbruk per kategori</CardTitle>
        <PieChart className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-5 px-4 sm:px-6 pb-4 sm:pb-6">
        {categoriesWithSpending.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Ingen forbruksdata ennå. Last opp en kvittering for å komme i gang!
          </p>
        ) : (
          categoriesWithSpending.map((cs) => (
            cs.budget > 0 ? (
              <BudgetProgress
                key={cs.category.id}
                label={cs.category.name}
                spent={cs.spent}
                budget={cs.budget}
                colorClass={colorClassMap[cs.category.color] || colorClassMap.other}
              />
            ) : (
              <div key={cs.category.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", colorClassMap[cs.category.color] || colorClassMap.other)} />
                  <span className="font-medium">{cs.category.name}</span>
                </div>
                <span className="tabular-nums text-muted-foreground">{formatNOK(cs.spent)}</span>
              </div>
            )
          ))
        )}
      </CardContent>
    </Card>
  );
}
