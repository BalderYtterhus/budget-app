import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useHousehold } from "@/contexts/HouseholdContext";

export interface Settlement {
  id: string;
  name: string;
  type: "household" | "custom";
  status: "active" | "closed";
  created_by: string;
  household_id: string;
  created_at: string;
}

export interface SettlementMember {
  id: string;
  settlement_id: string;
  user_id: string;
  ratio: number;
}

export function useSettlements() {
  const { household } = useHousehold();

  return useQuery({
    queryKey: ["settlements", household?.id],
    queryFn: async () => {
      if (!household) return [];

      const { data, error } = await supabase
        .from("settlements")
        .select("*, settlement_members(*)")
        .eq("household_id", household.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as (Settlement & { settlement_members: SettlementMember[] })[];
    },
    enabled: !!household,
  });
}

export function useCreateSettlement() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { household } = useHousehold();

  return useMutation({
    mutationFn: async ({ name, memberIds, ratios }: {
      name: string;
      memberIds: string[];
      ratios: Record<string, number>;
    }) => {
      if (!household) throw new Error("No household");

      const { data: settlement, error } = await supabase
        .from("settlements")
        .insert({
          name,
          type: "custom",
          created_by: user?.id,
          household_id: household.id,
        })
        .select()
        .single();

      if (error) throw error;

      const members = memberIds.map(userId => ({
        settlement_id: settlement.id,
        user_id: userId,
        ratio: ratios[userId] ?? 100 / memberIds.length,
      }));

      const { error: memberError } = await supabase
        .from("settlement_members")
        .insert(members);

      if (memberError) throw memberError;
      // Same cast the read paths use: the DB stores type/status as text with
      // CHECK constraints, so the union is guaranteed but not expressed.
      return settlement as Settlement;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settlements"] }),
  });
}

export function useCloseSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settlementId: string) => {
      const { error } = await supabase
        .from("settlements")
        .update({ status: "closed" })
        .eq("id", settlementId);

      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settlements"] }),
  });
}

export function useReopenSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settlementId: string) => {
      const { error } = await supabase
        .from("settlements")
        .update({ status: "active" })
        .eq("id", settlementId);

      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settlements"] }),
  });
}

export function useClosedSettlements() {
  const { household } = useHousehold();

  return useQuery({
    queryKey: ["closed-settlements", household?.id],
    queryFn: async () => {
      if (!household) return [];

      const { data, error } = await supabase
        .from("settlements")
        .select("*")
        .eq("household_id", household.id)
        .eq("status", "closed")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as Settlement[];
    },
    enabled: !!household,
  });
}
