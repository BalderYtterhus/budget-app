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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useSettlementContext } from "@/contexts/SettlementContext";
import { Settlement, useCreateSettlement, useCloseSettlement, useReopenSettlement, useClosedSettlements } from "@/hooks/useSettlements";
import { RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useHousehold } from "@/contexts/HouseholdContext";

interface SettlementSwitcherProps {
  /**
   * "header" is the compact inline trigger. "sidebar" matches the boxed nav
   * items it sits among — same shape as the placeholder button it replaced.
   */
  variant?: "header" | "sidebar";
}

export function SettlementSwitcher({ variant = "header" }: SettlementSwitcherProps = {}) {
  const { activeSettlement, setActiveSettlement, settlements } = useSettlementContext();
  const createSettlement = useCreateSettlement();
  const closeSettlement = useCloseSettlement();
  const reopenSettlement = useReopenSettlement();
  const { data: closedSettlements } = useClosedSettlements();
  const { toast } = useToast();
  const { user } = useAuth();
  const { members } = useHousehold();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  // Held outside the dropdown: the menu unmounts on click, so an AlertDialog
  // rendered inside it would never appear.
  const [pendingClose, setPendingClose] = useState<Settlement | null>(null);

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

  const handleClose = async () => {
    if (!pendingClose) return;
    try {
      await closeSettlement.mutateAsync(pendingClose.id);
      toast({ title: "Oppgjør avsluttet" });
    } catch {
      toast({ title: "Feil ved avslutning", variant: "destructive" });
    } finally {
      setPendingClose(null);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {variant === "sidebar" ? (
            <button className="w-full flex items-center gap-2.5 bg-secondary border border-border rounded-lg px-2.5 py-2 text-[13px] font-medium text-left hover:bg-accent/50 transition-colors">
              <span
                className={cn(
                  "w-2 h-2 rounded-full flex-shrink-0",
                  activeSettlement ? "bg-[hsl(160_60%_45%)]" : "bg-muted-foreground/40"
                )}
              />
              <span className="flex-1 truncate">
                {activeSettlement?.name || "Ingen oppgjør"}
              </span>
              <ChevronsUpDown className="h-3 w-3 text-muted-foreground shrink-0" />
            </button>
          ) : (
            <Button variant="ghost" className="flex items-center gap-1 h-auto py-0 px-1 text-left">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate max-w-[140px] sm:max-w-[200px]">
                  {activeSettlement?.name || "Velg oppgjør"}
                </p>
              </div>
              <ChevronsUpDown className="h-3 w-3 text-muted-foreground shrink-0" />
            </Button>
          )}
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
                onClick={(e) => {
                  e.stopPropagation();
                  setPendingClose(settlement);
                }}
                aria-label={`Avslutt ${settlement.name}`}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </DropdownMenuItem>
          ))}

          {settlements.length > 0 && <DropdownMenuSeparator />}

          {closedSettlements && closedSettlements.length > 0 && (
            <>
              {closedSettlements.map(s => (
                <DropdownMenuItem
                  key={s.id}
                  className="flex items-center justify-between gap-2 cursor-pointer text-muted-foreground"
                  onClick={async (e) => {
                    e.preventDefault();
                    await reopenSettlement.mutateAsync(s.id);
                    toast({ title: `«${s.name}» gjenåpnet` });
                  }}
                >
                  <span className="truncate text-xs">{s.name}</span>
                  <RotateCcw className="h-3 w-3 shrink-0" />
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuItem
            className="cursor-pointer text-primary"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Legg til oppgjør
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={!!pendingClose} onOpenChange={open => !open && setPendingClose(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Avslutte oppgjøret?</AlertDialogTitle>
            <AlertDialogDescription>
              «{pendingClose?.name}» lukkes. Kvitteringene blir liggende og vises fortsatt i lista — du kan gjenåpne oppgjøret fra samme meny.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleClose} disabled={closeSettlement.isPending}>
              {closeSettlement.isPending ? "Lukker…" : "Avslutt oppgjør"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
