import { useMemo } from "react";
import { Receipt } from "@/types/budget";
import { useHousehold } from "@/contexts/HouseholdContext";
import { useSettlementContext } from "@/contexts/SettlementContext";
import { useSettlements } from "@/hooks/useSettlements";
import { useMonthlyReceipts, useSplitRatios } from "@/hooks/useBudgetData";

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
 * What a receipt contributes to spending: the sum of its included items, or the
 * receipt total when nothing was parsed. Excluded items (included_in_totals =
 * false) are deliberately dropped — that flag exists so non-shared purchases on
 * a shared receipt stay out of the split.
 */
export function receiptTotal(receipt: Receipt): number {
  const items = receipt.items ?? [];
  if (items.length === 0) return Number(receipt.total_amount);
  return items
    .filter((item) => item.included_in_totals !== false)
    .reduce((sum, item) => sum + Number(item.price), 0);
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
    const usingHouseholdFallback = settlementMembers.length === 0;

    const memberIds = usingHouseholdFallback
      ? members.map((m) => m.user_id)
      : settlementMembers.map((m) => m.user_id);

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

    const rawRatio = (userId: string): number => {
      if (!usingHouseholdFallback) {
        const member = settlementMembers.find((m) => m.user_id === userId);
        if (member) return Number(member.ratio);
      }
      const ratio = splitRatios?.find((r) => r.user_id === userId);
      if (ratio) return Number(ratio.ratio);
      return 100 / memberIds.length;
    };

    // Normalise: ratios come from two tables that can each be partially filled,
    // so they are not guaranteed to sum to 100. Without this, shouldPay across
    // members would not add up to totalSpent and the transactions below would
    // not close out.
    const rawRatios = memberIds.map(rawRatio);
    const ratioSum = rawRatios.reduce((sum, r) => sum + r, 0);
    const ratios = memberIds.map((_, idx) =>
      ratioSum > 0 ? (rawRatios[idx] / ratioSum) * 100 : 100 / memberIds.length
    );

    const balances: MemberBalance[] = memberIds.map((userId, idx) => {
      const paid = paidByUser[userId] || 0;
      const shouldPay = totalSpent * (ratios[idx] / 100);
      return { userId, paid, ratio: ratios[idx], shouldPay, balance: paid - shouldPay };
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
