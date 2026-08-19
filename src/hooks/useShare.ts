import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Receipt } from "@/types/budget";
import { useAuth } from "@/contexts/AuthContext";
import { useHousehold } from "@/contexts/HouseholdContext";
import { useSplitRatios } from "@/hooks/useBudgetData";
import {
  RatioRow,
  receiptShare,
  resolveMemberIds,
  settlementRatios,
} from "@/lib/share";

/**
 * Every settlement in the household **including closed ones**, with members.
 *
 * Deliberately not useSettlements(): that filters `status = 'active'`, which is
 * right for a switcher but wrong for share math. A closed settlement's receipts
 * still count toward the month — closing records that it was paid up, it does
 * not retract the spending. Reusing useSettlements() here would make every
 * closed settlement's receipts silently worth 0 to their own members.
 */
export function useAllSettlementMembers() {
  const { household } = useHousehold();

  return useQuery({
    queryKey: ["settlement-members-all", household?.id],
    queryFn: async (): Promise<Record<string, RatioRow[]>> => {
      if (!household) return {};

      const { data, error } = await supabase
        .from("settlements")
        .select("id, settlement_members(user_id, ratio)")
        .eq("household_id", household.id);

      if (error) throw error;

      return Object.fromEntries(
        (data ?? []).map((s) => [s.id, (s.settlement_members ?? []) as RatioRow[]]),
      );
    },
    enabled: !!household,
  });
}

/**
 * `(receipt) => what this receipt cost the signed-in user`, per the rule table
 * in §3 of docs/product-plan.md. See src/lib/share.ts for the rules themselves.
 *
 * This is the single entry point the personal dashboard should use. Do not
 * re-derive shares in a component — three copies of the settlement math is how
 * the household-vs-settlement member bug survived.
 */
export function useMyReceiptShare(): (receipt: Receipt) => number {
  const { user } = useAuth();
  const { members } = useHousehold();
  const { data: splitRatios } = useSplitRatios();
  const { data: settlementMembers } = useAllSettlementMembers();

  const householdMemberIds = useMemo(
    () => members.map((m) => m.user_id),
    [members],
  );

  const ratiosBySettlement = useMemo(() => {
    const out = new Map<string, Map<string, number>>();
    for (const [settlementId, rows] of Object.entries(settlementMembers ?? {})) {
      const { memberIds, usingHouseholdFallback } = resolveMemberIds(
        rows,
        householdMemberIds,
      );
      out.set(
        settlementId,
        settlementRatios(memberIds, rows, splitRatios, usingHouseholdFallback),
      );
    }
    return out;
  }, [settlementMembers, householdMemberIds, splitRatios]);

  return useMemo(() => {
    return (receipt: Receipt) => {
      if (!user) return 0;
      return receiptShare(receipt, user.id, (id) => ratiosBySettlement.get(id));
    };
  }, [user, ratiosBySettlement]);
}
