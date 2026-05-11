import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Settlement {
  id: string;
  name: string;
  type: "household" | "custom";
  status: "active" | "closed";
  created_by: string;
  created_at: string;
}

export interface SettlementMember {
  id: string;
  settlement_id: string;
  user_id: string;
  ratio: number;
}

// Hent alle aktive oppgjør brukeren er med i
export function useSettlements() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["settlements", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settlements")
        .select("*, settlement_members(*)")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as (Settlement & { settlement_members: SettlementMember[] })[];
    },
    enabled: !!user,
  });
}

// Opprett nytt oppgjør
export function useCreateSettlement() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ name, memberIds, ratios }: {
      name: string;
      memberIds: string[];
      ratios: Record<string, number>;
    }) => {
      const { data: settlement, error } = await supabase
        .from("settlements")
        .insert({ name, type: "custom", created_by: user?.id })
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
      return settlement;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settlements"] }),
  });
}

// Avslutt oppgjør
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
