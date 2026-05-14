import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

interface Household {
  id: string;
  name: string;
  invite_token: string | null;
  invite_enabled: boolean;
  invite_expires_at: string | null;
}

interface HouseholdMember {
  id: string;
  user_id: string;
  role: string;
  profile?: {
    display_name: string | null;
    email: string | null;
  };
}

interface HouseholdContextType {
  household: Household | null;
  members: HouseholdMember[];
  loading: boolean;
  refetchHousehold: () => Promise<void>;
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHousehold = async () => {
    if (!user) {
      setHousehold(null);
      setMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Get user's household membership
      const { data: membership, error: membershipError } = await supabase
        .from("household_memberships")
        .select("household_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (membershipError || !membership) {
        setHousehold(null);
        setMembers([]);
        setLoading(false);
        return;
      }

      // Get household details including invite info
      const { data: householdData, error: householdError } = await supabase
        .from("households")
        .select("id, name, invite_token, invite_enabled, invite_expires_at")
        .eq("id", membership.household_id)
        .single();

      if (householdError || !householdData) {
        setHousehold(null);
        setMembers([]);
        setLoading(false);
        return;
      }

      setHousehold(householdData);

      // Get all members of this household
      const { data: membersData } = await supabase
        .from("household_memberships")
        .select(`
          id,
          user_id,
          role
        `)
        .eq("household_id", householdData.id);

      // Get profiles for members
      if (membersData && membersData.length > 0) {
        const userIds = membersData.map(m => m.user_id);
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, display_name, email")
          .in("user_id", userIds);

        const membersWithProfiles = membersData.map(member => ({
          ...member,
          profile: profilesData?.find(p => p.user_id === member.user_id) || null,
        }));

        setMembers(membersWithProfiles);
      } else {
        setMembers([]);
      }
    } catch (error) {
      console.error("Error fetching household:", error);
      setHousehold(null);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHousehold();
  }, [user]);

  return (
    <HouseholdContext.Provider 
      value={{ 
        household, 
        members, 
        loading, 
        refetchHousehold: fetchHousehold 
      }}
    >
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold() {
  const context = useContext(HouseholdContext);
  if (context === undefined) {
    throw new Error("useHousehold must be used within a HouseholdProvider");
  }
  return context;
}
