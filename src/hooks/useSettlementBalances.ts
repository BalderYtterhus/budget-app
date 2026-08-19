import { useMemo } from "react";
import { Receipt } from "@/types/budget";
import { useHousehold } from "@/contexts/HouseholdContext";
import { useSettlementContext } from "@/contexts/SettlementContext";
import { useSettlements } from "@/hooks/useSettlements";
import { useMonthlyReceipts, useSplitRatios } from "@/hooks/useBudgetData";
import { receiptTotal, resolveMemberIds, settlementRatios } from "@/lib/share";

// Re-exported so existing importers (Settlement.tsx) keep working. The
// definition now lives in src/lib/share.ts so the personal dashboard and the
// settlement pages share one copy — see Phase 2 of docs/product-plan.md.
export { receiptTotal };

export interface MemberBalance {
  userId: string;
  paid: number;
  /** Percent of the settlement this member carries. */
  ratio: number;
  shouldPay: number;
  /** paid − shouldPay. Positive = is owed money. */
  balance: number;
}

export interface SettlementTransaction {
  from: string;
  to: string;
  amount: number;
}

export interface SettlementBalances {
  /** This month's receipts belonging to the settlement. */
  receipts: Receipt[];
  paidByUser: Record<string, number>;
  balances: MemberBalance[];
  transactions: SettlementTransaction[];
  totalSpent: number;
  /** Receipts in the settlement with no paid_by_user — they skew every balance. */
  unassignedPayerCount: number;
  /** True when the split falls back to household members because the
   *  settlement has no settlement_members rows (pre-dates the members write). */
  usingHouseholdFallback: boolean;
}

/**
 * Who owes whom within one settlement.
 *
 * Membership and ratios come from `settlement_members` — the rows
 * useCreateSettlement writes — NOT from household membership. The three
 * previous copies of this math (AppSidebar, SettlementOversikt, Settlement)
 * all split across every household member at household split_ratios, so a
 * member who was not on a custom settlement was still charged for it.
 *
 * Household members + split_ratios remain the fallback for settlements created
 * before members were written, so those keep their previous behaviour.
 *
 * @param settlementId defaults to the active settlement.
 */
export function useSettlementBalances(settlementId?: string | null): SettlementBalances {
  const { members } = useHousehold();
  const { activeSettlement } = useSettlementContext();
  const { data: settlements } = useSettlements();
  const { data: receipts } = useMonthlyReceipts();
  const { data: splitRatios } = useSplitRatios();

  const targetId = settlementId !== undefined ? settlementId : activeSettlement?.id ?? null;

  return useMemo(() => {
    const empty: SettlementBalances = {
      receipts: [],
      paidByUser: {},
      balances: [],
      transactions: [],
      totalSpent: 0,
      unassignedPayerCount: 0,
      usingHouseholdFallback: false,
    };
    if (!targetId) return empty;

    const scoped = (receipts ?? []).filter((r) => r.settlement_id === targetId);

    const settlementMembers =
      settlements?.find((s) => s.id === targetId)?.settlement_members ?? [];

    const { memberIds, usingHouseholdFallback } = resolveMemberIds(
      settlementMembers,
      members.map((m) => m.user_id),
    );

    if (memberIds.length === 0) return { ...empty, receipts: scoped, usingHouseholdFallback };

    const paidByUser: Record<string, number> = {};
    let unassignedPayerCount = 0;
    for (const receipt of scoped) {
      if (!receipt.paid_by_user) {
        unassignedPayerCount++;
        continue;
      }
      paidByUser[receipt.paid_by_user] =
        (paidByUser[receipt.paid_by_user] || 0) + receiptTotal(receipt);
    }

    const totalSpent = Object.values(paidByUser).reduce((sum, amount) => sum + amount, 0);

    // Ratio resolution and normalisation now live in src/lib/share.ts, so the
    // personal dashboard reads the same percentages these balances are built
    // from. Behaviour is unchanged — this is the same code, moved.
    const ratios = settlementRatios(
      memberIds,
      settlementMembers,
      splitRatios,
      usingHouseholdFallback,
    );

    const balances: MemberBalance[] = memberIds.map((userId) => {
      const paid = paidByUser[userId] || 0;
      const ratio = ratios.get(userId) ?? 0;
      const shouldPay = totalSpent * (ratio / 100);
      return { userId, paid, ratio, shouldPay, balance: paid - shouldPay };
    });

    // Two-pointer minimum-transaction settle: biggest debtor pays biggest
    // creditor until one of them is square, repeat.
    const transactions: SettlementTransaction[] = [];
    const working = balances
      .map((b) => ({ userId: b.userId, balance: b.balance }))
      .sort((a, b) => a.balance - b.balance);

    let i = 0;
    let j = working.length - 1;
    while (i < j) {
      if (working[i].balance >= -0.01) break;
      if (working[j].balance <= 0.01) break;
      const amount = Math.min(-working[i].balance, working[j].balance);
      if (amount > 0.01) {
        transactions.push({
          from: working[i].userId,
          to: working[j].userId,
          amount: Math.round(amount * 100) / 100,
        });
      }
      working[i].balance += amount;
      working[j].balance -= amount;
      if (working[i].balance >= -0.01) i++;
      if (working[j].balance <= 0.01) j--;
    }

    return {
      receipts: scoped,
      paidByUser,
      balances,
      transactions,
      totalSpent,
      unassignedPayerCount,
      usingHouseholdFallback,
    };
  }, [targetId, receipts, settlements, members, splitRatios]);
}
