import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSettlements, Settlement } from "@/hooks/useSettlements";

interface SettlementContextType {
  activeSettlement: Settlement | null;
  setActiveSettlement: (settlement: Settlement) => void;
  settlements: Settlement[];
  loading: boolean;
}

const SettlementContext = createContext<SettlementContextType | null>(null);

export function SettlementProvider({ children }: { children: ReactNode }) {
  const { data: settlements = [], isLoading } = useSettlements();
  const [activeSettlement, setActiveSettlementState] = useState<Settlement | null>(null);

  // Sett aktivt oppgjør fra localStorage eller første i listen.
  //
  // useSettlements returns active settlements only, so closing the active one
  // removes it from this list. Bailing out on an empty list (as this did) left
  // activeSettlement pointing at a closed settlement indefinitely, and the
  // stored id kept resolving to nothing on every reload.
  useEffect(() => {
    if (settlements.length === 0) {
      setActiveSettlementState(null);
      localStorage.removeItem("activeSettlementId");
      return;
    }

    const savedId = localStorage.getItem("activeSettlementId");
    const next = settlements.find(s => s.id === savedId) ?? settlements[0];
    setActiveSettlementState(next);
    // Write through, so a stale id does not silently resolve to a different
    // settlement on each load.
    if (next.id !== savedId) localStorage.setItem("activeSettlementId", next.id);
  }, [settlements]);

  const setActiveSettlement = (settlement: Settlement) => {
    setActiveSettlementState(settlement);
    localStorage.setItem("activeSettlementId", settlement.id);
  };

  return (
    <SettlementContext.Provider value={{
      activeSettlement,
      setActiveSettlement,
      settlements,
      loading: isLoading,
    }}>
      {children}
    </SettlementContext.Provider>
  );
}

export function useSettlementContext() {
  const ctx = useContext(SettlementContext);
  if (!ctx) throw new Error("useSettlementContext must be used within SettlementProvider");
  return ctx;
}
