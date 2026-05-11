import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatNOK } from "@/lib/format";

interface BudgetProgressProps {
  spent: number;
  budget: number;
  label?: string;
  showAmount?: boolean;
  size?: "sm" | "md" | "lg";
  colorClass?: string;
}

export function BudgetProgress({
  spent,
  budget,
  label,
  showAmount = true,
  size = "md",
  colorClass,
}: BudgetProgressProps) {
  const percent = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const isOverBudget = spent > budget && budget > 0;
  const remaining = budget - spent;

  const heightClass = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  }[size];

  const getProgressColor = () => {
    if (isOverBudget) return "bg-destructive";
    if (percent > 80) return "bg-warning";
    return colorClass || "bg-primary";
  };

  return (
    <div className="space-y-1.5">
      {(label || showAmount) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="font-medium text-foreground">{label}</span>}
          {showAmount && (
            <span
              className={cn(
                "tabular-nums",
                isOverBudget ? "text-destructive font-semibold" : "text-muted-foreground"
              )}
            >
              {formatNOK(spent)} / {formatNOK(budget)}
            </span>
          )}
        </div>
      )}
      <div className={cn("relative w-full rounded-full bg-secondary overflow-hidden", heightClass)}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            getProgressColor()
          )}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
        {isOverBudget && (
          <div
            className="absolute inset-0 bg-destructive/20 animate-pulse-soft"
            style={{ width: "100%" }}
          />
        )}
      </div>
      {showAmount && budget > 0 && (
        <p
          className={cn(
            "text-xs",
            isOverBudget ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {isOverBudget
            ? `${formatNOK(Math.abs(remaining))} over budsjett`
            : `${formatNOK(remaining)} gjenstår`}
        </p>
      )}
    </div>
  );
}
