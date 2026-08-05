import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowRight, Settings, AlertTriangle, CheckCircle } from "lucide-react";
import { useHousehold } from "@/contexts/HouseholdContext";
import { useSplitRatios, useSaveSplitRatios } from "@/hooks/useBudgetData";
import { useSettlementBalances, receiptTotal } from "@/hooks/useSettlementBalances";
import { formatNOK } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";

interface SettlementResult {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
}

export function Settlement() {
  const { members } = useHousehold();
  const { data: splitRatios } = useSplitRatios();
  const saveSplitRatios = useSaveSplitRatios();
  const { toast } = useToast();

  // Membership, ratios and the settle-up math all come from the active
  // settlement — see useSettlementBalances. This component used to compute them
  // from household members at household split_ratios, which charged people for
  // settlements they were never on.
  const {
    receipts: settlementReceipts,
    balances,
    transactions,
    totalSpent,
  } = useSettlementBalances();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingRatios, setEditingRatios] = useState<Record<string, number>>({});

  // Get display name for a user
  const getMemberName = (userId: string) => {
    const member = members.find(m => m.user_id === userId);
    return member?.profile?.display_name || member?.profile?.email?.split("@")[0] || "Ukjent";
  };

  // Calculate unassigned receipts
  const unassignedReceipts = settlementReceipts.filter(r => !r.paid_by_user);
  const unassignedTotal = unassignedReceipts.reduce((sum, r) => sum + receiptTotal(r), 0);

  // TODO (🔴 #2): this editor writes household-level split_ratios, which are
  // only the fallback once a settlement has settlement_members rows. Before
  // mounting this component, it needs to write settlement_members.ratio for the
  // active settlement instead, or the numbers above will not move when saved.
  const getRatio = (userId: string): number => {
    const ratio = splitRatios?.find(r => r.user_id === userId);
    if (ratio) return Number(ratio.ratio);
    return members.length > 0 ? 100 / members.length : 50;
  };

  const settlements: SettlementResult[] = transactions.map(t => ({
    fromUserId: t.from,
    fromUserName: getMemberName(t.from),
    toUserId: t.to,
    toUserName: getMemberName(t.to),
    amount: t.amount,
  }));

  const handleOpenSettings = () => {
    // Initialize editing ratios with current values
    const initial: Record<string, number> = {};
    members.forEach(member => {
      initial[member.user_id] = getRatio(member.user_id);
    });
    setEditingRatios(initial);
    setIsSettingsOpen(true);
  };

  const handleSaveRatios = async () => {
    // Validate total is 100%
    const total = Object.values(editingRatios).reduce((sum, r) => sum + r, 0);
    if (Math.abs(total - 100) > 0.1) {
      toast({
        title: "Fordelingen må være 100%",
        description: `Nåværende sum: ${total.toFixed(1)}%`,
        variant: "destructive",
      });
      return;
    }

    try {
      await saveSplitRatios.mutateAsync(
        Object.entries(editingRatios).map(([userId, ratio]) => ({
          userId,
          ratio,
        }))
      );
      setIsSettingsOpen(false);
      toast({ title: "Fordeling lagret!" });
    } catch (error) {
      console.error("Error saving ratios:", error);
      toast({
        title: "Feil ved lagring",
        variant: "destructive",
      });
    }
  };

  const handleRatioChange = (userId: string, value: string) => {
    const num = parseFloat(value) || 0;
    setEditingRatios(prev => ({ ...prev, [userId]: num }));
  };

  // Auto-balance ratios
  const handleAutoBalance = () => {
    const equalRatio = 100 / members.length;
    const balanced: Record<string, number> = {};
    members.forEach(member => {
      balanced[member.user_id] = Math.round(equalRatio * 10) / 10;
    });
    // Adjust last one to make exactly 100
    if (members.length > 0) {
      const sum = Object.values(balanced).reduce((a, b) => a + b, 0);
      const lastUserId = members[members.length - 1].user_id;
      balanced[lastUserId] = Math.round((balanced[lastUserId] + (100 - sum)) * 10) / 10;
    }
    setEditingRatios(balanced);
  };

  const currentRatioTotal = Object.values(editingRatios).reduce((sum, r) => sum + r, 0);

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6 pb-4">
        <CardTitle className="text-base sm:text-lg font-display">Oppgjør</CardTitle>
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleOpenSettings}>
              <Settings className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Fordeling av utgifter</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Angi hvor stor andel hver person skal betale av felles utgifter.
              </p>
              
              {members.map(member => (
                <div key={member.user_id} className="flex items-center gap-3">
                  <Label className="flex-1 text-sm">
                    {getMemberName(member.user_id)}
                  </Label>
                  <div className="relative w-24">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={editingRatios[member.user_id] || 0}
                      onChange={(e) => handleRatioChange(member.user_id, e.target.value)}
                      className="pr-6 text-right"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      %
                    </span>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm font-medium">Sum</span>
                <span className={`text-sm font-medium ${Math.abs(currentRatioTotal - 100) > 0.1 ? "text-destructive" : "text-success"}`}>
                  {currentRatioTotal.toFixed(1)}%
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={handleAutoBalance}>
                  Lik fordeling
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleSaveRatios}
                  disabled={Math.abs(currentRatioTotal - 100) > 0.1}
                >
                  Lagre
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
        {/* Unassigned warning */}
        {unassignedReceipts.length > 0 && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-warning">Mangler betaler</p>
              <p className="text-muted-foreground">
                {unassignedReceipts.length} kvittering{unassignedReceipts.length > 1 ? "er" : ""} ({formatNOK(unassignedTotal)}) mangler hvem som betalte.
              </p>
            </div>
          </div>
        )}

        {/* Spending summary */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Totalt denne måneden</span>
            <span className="font-semibold">{formatNOK(totalSpent)}</span>
          </div>
          
          {balances.map(member => (
            <div key={member.userId} className="flex justify-between text-sm py-1 border-t first:border-t-0">
              <div>
                <span>{getMemberName(member.userId)}</span>
                <span className="text-muted-foreground ml-1">({member.ratio.toFixed(0)}%)</span>
              </div>
              <div className="text-right">
                <span className="font-medium">{formatNOK(member.paid)}</span>
                <span className="text-muted-foreground text-xs ml-1">
                  / {formatNOK(member.shouldPay)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Settlement result */}
        {settlements.length > 0 ? (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-sm font-medium">Resultat</p>
            {settlements.map((settlement, index) => (
              <div 
                key={index}
                className="flex items-center justify-between gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{settlement.fromUserName}</span>
                  <ArrowRight className="h-4 w-4 text-primary" />
                  <span className="font-medium">{settlement.toUserName}</span>
                </div>
                <span className="font-bold text-primary">{formatNOK(settlement.amount)}</span>
              </div>
            ))}
          </div>
        ) : totalSpent > 0 && balances.length >= 2 ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-sm text-success font-medium">Alle har betalt sin andel!</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
