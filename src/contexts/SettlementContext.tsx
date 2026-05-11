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

  // Sett aktivt oppgjør fra localStorage eller første i listen
  useEffect(() => {
    if (settlements.length === 0) return;

    const savedId = localStorage.getItem("activeSettlementId");
    const saved = settlements.find(s => s.id === savedId);
    setActiveSettlementState(saved || settlements[0]);
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
