import { useState } from "react";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettlementContext } from "@/contexts/SettlementContext";
import { useCreateSettlement, useCloseSettlement } from "@/hooks/useSettlements";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useHousehold } from "@/contexts/HouseholdContext";

export function SettlementSwitcher() {
  const { activeSettlement, setActiveSettlement, settlements } = useSettlementContext();
  const createSettlement = useCreateSettlement();
  const closeSettlement = useCloseSettlement();
  const { toast } = useToast();
  const { user } = useAuth();
  const { members } = useHousehold();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const handleCreate = async () => {
    if (!newName.trim()) return;

    try {
      // Include all household members in the settlement
      const memberIds = members.length > 0 ? members.map(m => m.user_id) : [user!.id];
      const equalRatio = 100 / memberIds.length;
      const ratios = Object.fromEntries(memberIds.map(id => [id, equalRatio]));

      const settlement = await createSettlement.mutateAsync({
        name: newName.trim(),
        memberIds,
        ratios,
      });
      setActiveSettlement(settlement);
      setIsCreateOpen(false);
      setNewName("");
      toast({ title: "Oppgjør opprettet!" });
    } catch {
      toast({ title: "Feil ved oppretting", variant: "destructive" });
    }
  };

  const handleClose = async (settlementId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await closeSettlement.mutateAsync(settlementId);
      toast({ title: "Oppgjør avsluttet" });
    } catch {
      toast({ title: "Feil ved avslutning", variant: "destructive" });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-1 h-auto py-0 px-1 text-left">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate max-w-[140px] sm:max-w-[200px]">
                {activeSettlement?.name || "Velg oppgjør"}
              </p>
            </div>
            <ChevronsUpDown className="h-3 w-3 text-muted-foreground shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {settlements.map(settlement => (
            <DropdownMenuItem
              key={settlement.id}
              className="flex items-center justify-between gap-2 cursor-pointer"
              onClick={() => setActiveSettlement(settlement)}
            >
              <div className="flex items-center gap-2 min-w-0">
                {activeSettlement?.id === settlement.id && (
                  <Check className="h-3 w-3 shrink-0 text-primary" />
                )}
                <span className="truncate">{settlement.name}</span>
              </div>
              <button
                onClick={(e) => handleClose(settlement.id, e)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </DropdownMenuItem>
          ))}

          {settlements.length > 0 && <DropdownMenuSeparator />}

          <DropdownMenuItem
            className="cursor-pointer text-primary"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Legg til oppgjør
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nytt oppgjør</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Navn</Label>
              <Input
                placeholder="f.eks. Hyttetur april"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreate()}
                autoFocus
              />
            </div>
            <Button
              className="w-full"
              onClick={handleCreate}
              disabled={!newName.trim() || createSettlement.isPending}
            >
              Opprett
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
