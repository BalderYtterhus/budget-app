import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetProgress } from "./BudgetProgress";
import { useSpendingSummary } from "@/hooks/useBudgetData";
import { Wallet, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNOK } from "@/lib/format";
import { useMonth } from "@/contexts/MonthContext";

export function SpendingOverview() {
  const { data: summary, isLoading } = useSpendingSummary();
  const { isCurrentMonth } = useMonth();

  if (isLoading) {
    return (
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="h-3.5 bg-muted rounded w-24" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="h-7 bg-muted rounded w-28 mb-2" />
              <div className="h-2 bg-muted rounded w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const { totalSpent, totalBudget, remaining, percentUsed, isOverBudget } = summary;

  return (
    <div className="space-y-3">
    {totalBudget > 0 && (isOverBudget || percentUsed >= 90) && (
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-lg border text-sm font-medium",
        isOverBudget
          ? "bg-destructive/10 border-destructive/30 text-destructive"
          : "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300"
      )}>
        <AlertTriangle className="h-4 w-4 shrink-0" />
        {isOverBudget
          ? `Du er ${formatNOK(Math.abs(remaining))} over budsjettet denne måneden.`
          : `Advarsel: du har brukt ${percentUsed.toFixed(0)}% av månedensbudsjettet.`}
      </div>
    )}
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
      {/* Total Spent */}
      <Card>
        <CardContent className="px-4 py-3.5">
          <p className="text-[12px] font-medium text-muted-foreground">Totalt brukt</p>
          <div className="text-[22px] font-semibold tabular-nums tracking-tight mt-1.5">
            {formatNOK(totalSpent)}
          </div>
          <p className="text-[11.5px] text-muted-foreground mt-1.5">
            {isCurrentMonth ? "Denne måneden" : "Valgt måned"}
          </p>
        </CardContent>
      </Card>

      {/* Budget Status */}
      <Card>
        <CardContent className="px-4 py-3.5">
          <p className="text-[12px] font-medium text-muted-foreground">Budsjett</p>
          <div className="text-[22px] font-semibold tabular-nums tracking-tight mt-1.5">
            {totalBudget > 0 ? formatNOK(totalBudget) : "—"}
          </div>
          <div className="mt-2 space-y-1">
            <BudgetProgress spent={totalSpent} budget={totalBudget} showAmount={false} size="lg" />
            <p className="text-[11.5px] text-muted-foreground">
              {totalBudget > 0 ? `${percentUsed.toFixed(0)}% brukt` : "Ingen budsjett satt"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Remaining */}
      <Card className={cn(isOverBudget && "border-destructive/40")}>
        <CardContent className="px-4 py-3.5">
          <p className="text-[12px] font-medium text-muted-foreground">
            {isOverBudget ? "Over budsjett" : "Gjenstående"}
          </p>
          <div className={cn(
            "text-[22px] font-semibold tabular-nums tracking-tight mt-1.5",
            isOverBudget ? "text-destructive" : "text-success"
          )}>
            {isOverBudget ? "−" : ""}{formatNOK(Math.abs(remaining))}
          </div>
          <p className="text-[11.5px] text-muted-foreground mt-1.5">
            {totalBudget > 0
              ? isOverBudget ? "Over budsjett"
              : "Tilgjengelig å bruke"
              : "Sett et budsjett"}
          </p>
        </CardContent>
      </Card>
    </div>
    </div>
  );
}
