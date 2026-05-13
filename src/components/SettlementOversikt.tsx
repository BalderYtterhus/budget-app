import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowRight, AlertTriangle, CheckCircle, Users } from "lucide-react";
import { useHousehold } from "@/contexts/HouseholdContext";
import { useMonthlyReceipts, useSplitRatios } from "@/hooks/useBudgetData";
import { useSettlementContext } from "@/contexts/SettlementContext";
import { formatNOK } from "@/lib/format";
import { cn } from "@/lib/utils";

export function SettlementOversikt() {
  const { members } = useHousehold();
  const { activeSettlement } = useSettlementContext();
  const { data: receipts } = useMonthlyReceipts();
  const { data: splitRatios } = useSplitRatios();

  const getMemberName = (userId: string) => {
    const member = members.find(m => m.user_id === userId);
    return member?.profile?.display_name || member?.profile?.email?.split("@")[0] || "Ukjent";
  };

  const getInitials = (userId: string) => {
    const name = getMemberName(userId);
    return name.slice(0, 2).toUpperCase();
  };

  const getRatio = (userId: string): number => {
    const ratio = splitRatios?.find(r => r.user_id === userId);
    if (ratio) return Number(ratio.ratio);
    return members.length > 0 ? 100 / members.length : 50;
  };

  const paidByUser = receipts?.reduce((acc, receipt) => {
    if (receipt.paid_by_user) {
      const items = receipt.items ?? [];
      const total = items.length > 0
        ? items.filter(i => i.included_in_totals !== false).reduce((s, i) => s + Number(i.price), 0)
        : Number(receipt.total_amount);
      acc[receipt.paid_by_user] = (acc[receipt.paid_by_user] || 0) + total;
    }
    return acc;
  }, {} as Record<string, number>) || {};

  const unassignedCount = receipts?.filter(r => !r.paid_by_user).length ?? 0;
  const totalSpent = Object.values(paidByUser).reduce((s, a) => s + a, 0);

  // Two-pointer minimum-transactions settlement
  const balances = members.map(member => {
    const shouldPay = totalSpent * (getRatio(member.user_id) / 100);
    const actuallyPaid = paidByUser[member.user_id] || 0;
    return { userId: member.user_id, balance: actuallyPaid - shouldPay };
  }).sort((a, b) => a.balance - b.balance);

  const transactions: { from: string; to: string; amount: number }[] = [];
  const bal = balances.map(b => ({ ...b }));
  let i = 0, j = bal.length - 1;
  while (i < j) {
    if (bal[i].balance >= -0.01) break;
    if (bal[j].balance <= 0.01) break;
    const amount = Math.min(-bal[i].balance, bal[j].balance);
    if (amount > 0.01) transactions.push({ from: bal[i].userId, to: bal[j].userId, amount: Math.round(amount * 100) / 100 });
    bal[i].balance += amount;
    bal[j].balance -= amount;
    if (bal[i].balance >= -0.01) i++;
    if (bal[j].balance <= 0.01) j--;
  }

  if (members.length < 2) return null;

  return (
    <Card className="shadow-card">
      <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg font-display flex items-center gap-2">
            <Users className="h-4 w-4" />
            Oversikt
          </CardTitle>
          {activeSettlement && (
            <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
              {activeSettlement.name}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3">

        {/* Unassigned warning */}
        {unassignedCount > 0 && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-warning/10 border border-warning/20 text-sm">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
            <span className="text-muted-foreground">
              {unassignedCount} kvittering{unassignedCount > 1 ? "er" : ""} mangler betaler
            </span>
          </div>
        )}

        {/* Member rows */}
        <div className="space-y-2">
          {members.map(member => {
            const paid = paidByUser[member.user_id] || 0;
            const shouldPay = totalSpent * (getRatio(member.user_id) / 100);
            const balance = paid - shouldPay;
            const isPositive = balance >= 0;

            return (
              <div key={member.user_id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {getInitials(member.user_id)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{getMemberName(member.user_id)}</p>
                  <p className="text-xs text-muted-foreground">
                    Betalt {formatNOK(paid)} · andel {getRatio(member.user_id).toFixed(0)}%
                  </p>
                </div>
                <div className={cn(
                  "text-sm font-semibold tabular-nums",
                  totalSpent === 0 ? "text-muted-foreground" : isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                )}>
                  {totalSpent === 0 ? "–" : `${isPositive ? "+" : ""}${formatNOK(balance)}`}
                </div>
              </div>
            );
          })}
        </div>

        {/* Settlement transactions */}
        {transactions.length > 0 ? (
          <div className="space-y-1.5 pt-1 border-t">
            {transactions.map((t, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10 text-sm">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">{getMemberName(t.from)}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium">{getMemberName(t.to)}</span>
                </div>
                <span className="font-bold text-primary tabular-nums">{formatNOK(t.amount)}</span>
              </div>
            ))}
          </div>
        ) : totalSpent > 0 ? (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-sm">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
            <span className="text-green-700 dark:text-green-400 font-medium">Alle har betalt sin andel!</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
