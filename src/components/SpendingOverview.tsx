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
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
              <div className="h-4 bg-muted rounded w-24" />
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="h-8 bg-muted rounded w-32 mb-2" />
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
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
      {/* Total Spent */}
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
            Totalt brukt
          </CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="text-xl sm:text-2xl font-bold font-display tabular-nums">
            {formatNOK(totalSpent)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isCurrentMonth ? "Denne måneden" : "Valgt måned"}
          </p>
        </CardContent>
      </Card>

      {/* Budget Status */}
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Budsjettstatus
          </CardTitle>
          {isOverBudget ? (
            <AlertTriangle className="h-4 w-4 text-destructive" />
          ) : percentUsed > 80 ? (
            <TrendingUp className="h-4 w-4 text-warning" />
          ) : (
            <TrendingDown className="h-4 w-4 text-success" />
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <BudgetProgress
              spent={totalSpent}
              budget={totalBudget}
              showAmount={false}
              size="lg"
            />
            <p className="text-xs text-muted-foreground">
              {totalBudget > 0
                ? `${percentUsed.toFixed(0)}% av ${formatNOK(totalBudget)} brukt`
                : "Ingen budsjett satt"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Remaining */}
      <Card className={cn("shadow-card", isOverBudget && "border-destructive/50")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {isOverBudget ? "Over budsjett" : "Gjenstående"}
          </CardTitle>
          {isOverBudget ? (
            <TrendingUp className="h-4 w-4 text-destructive" />
          ) : (
            <TrendingDown className="h-4 w-4 text-success" />
          )}
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "text-2xl font-bold font-display tabular-nums",
              isOverBudget ? "text-destructive" : "text-success"
            )}
          >
            {isOverBudget ? "-" : ""}{formatNOK(Math.abs(remaining))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {totalBudget > 0
              ? isOverBudget
                ? "Reduser forbruket for å komme tilbake på sporet"
                : "Tilgjengelig å bruke"
              : "Sett et budsjett for å spore"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
