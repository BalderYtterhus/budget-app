import { Receipt } from "@/types/budget";

/**
 * Phase 2 of docs/product-plan.md — one definition of "what is my share".
 *
 * This math lived inside useSettlementBalances, which is the only place it was
 * ever correct. Three earlier copies (AppSidebar, SettlementOversikt,
 * Settlement) each split across every household member at household
 * split_ratios, so a member who was not on a custom settlement was still
 * charged for it. The point of this module is that there is now one
 * implementation for the personal dashboard and the settlement pages to share.
 *
 * Everything here is pure: no React, no Supabase. The hooks in
 * src/hooks/useShare.ts supply the data.
 */

/** Anything with a user_id and a ratio — settlement_members or split_ratios. */
export interface RatioRow {
  user_id: string;
  ratio: number | string;
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
 * Who carries a settlement.
 *
 * Membership comes from `settlement_members` — the rows useCreateSettlement
 * writes — NOT from household membership. Household members remain the
 * fallback for settlements created before members were written, so those keep
 * their previous behaviour.
 */
export function resolveMemberIds(
  settlementMembers: RatioRow[],
  householdMemberIds: string[],
): { memberIds: string[]; usingHouseholdFallback: boolean } {
  const usingHouseholdFallback = settlementMembers.length === 0;
  return {
    usingHouseholdFallback,
    memberIds: usingHouseholdFallback
      ? householdMemberIds
      : settlementMembers.map((m) => m.user_id),
  };
}

/**
 * Each member's share of a settlement as a percentage, keyed by user id.
 *
 * Ratios come from two tables that can each be partially filled, so the raw
 * numbers are not guaranteed to sum to 100. They are normalised here — without
 * it, shouldPay across members would not add up to totalSpent and the
 * settle-up transactions would not close out.
 *
 * The returned percentages always sum to 100 (for a non-empty member list).
 */
export function settlementRatios(
  memberIds: string[],
  settlementMembers: RatioRow[],
  splitRatios: RatioRow[] | undefined,
  usingHouseholdFallback: boolean,
): Map<string, number> {
  if (memberIds.length === 0) return new Map();

  const rawRatio = (userId: string): number => {
    if (!usingHouseholdFallback) {
      const member = settlementMembers.find((m) => m.user_id === userId);
      if (member) return Number(member.ratio);
    }
    const ratio = splitRatios?.find((r) => r.user_id === userId);
    if (ratio) return Number(ratio.ratio);
    return 100 / memberIds.length;
  };

  const rawRatios = memberIds.map(rawRatio);
  const ratioSum = rawRatios.reduce((sum, r) => sum + r, 0);

  return new Map(
    memberIds.map((userId, idx) => [
      userId,
      ratioSum > 0 ? (rawRatios[idx] / ratioSum) * 100 : 100 / memberIds.length,
    ]),
  );
}

/**
 * One user's share of one receipt — the rule table in §3 of
 * docs/product-plan.md.
 *
 * | Receipt                                   | Share        |
 * |-------------------------------------------|--------------|
 * | in a settlement you are a member of       | total × your ratio |
 * | in a settlement you are NOT a member of   | 0            |
 * | in no settlement, you paid                | full total   |
 * | in no settlement, someone else paid       | 0            |
 *
 * A receipt in no settlement is 100% the payer's: it is not shared with
 * anyone, so it is entirely theirs.
 *
 * `ratiosFor` must cover **closed** settlements as well as active ones. A
 * closed settlement's receipts still count toward the month — closing a
 * settlement records that it was paid up, it does not retract the spending.
 * Returning undefined for a settlement that merely wasn't loaded would silently
 * zero real spend, which is why useShare.ts queries every settlement rather
 * than reusing useSettlements() (that one filters to status = 'active').
 */
export function receiptShare(
  receipt: Receipt,
  userId: string,
  ratiosFor: (settlementId: string) => Map<string, number> | undefined,
): number {
  const total = receiptTotal(receipt);

  if (!receipt.settlement_id) {
    return receipt.paid_by_user === userId ? total : 0;
  }

  const ratios = ratiosFor(receipt.settlement_id);
  if (!ratios) return 0;

  const ratio = ratios.get(userId);
  if (ratio === undefined) return 0;

  return total * (ratio / 100);
}
