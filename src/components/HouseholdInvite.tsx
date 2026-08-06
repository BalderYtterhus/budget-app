import { useState } from "react";
import { useHousehold } from "@/contexts/HouseholdContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Copy, RefreshCw, Link, Check, UserPlus, Clock, X } from "lucide-react";
import { format, isPast } from "date-fns";
import { nb } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface HouseholdInviteProps {
  inviteToken: string | null;
  inviteEnabled: boolean;
  onUpdate: () => void;
  /**
   * Controlled mode. Callers that already have their own trigger — the sidebar
   * "Inviter medlem" row, the /oppgjor empty state — pass these and set
   * `hideTrigger`, so the invite flow has one implementation rather than three.
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

export function HouseholdInvite({
  inviteToken,
  inviteEnabled,
  onUpdate,
  open,
  onOpenChange,
  hideTrigger,
}: HouseholdInviteProps) {
  const { household } = useHousehold();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isUpdatingEnabled, setIsUpdatingEnabled] = useState(false);
  const [isSettingExpiry, setIsSettingExpiry] = useState(false);

  const inviteExpiresAt = household?.invite_expires_at ?? null;
  const isExpired = inviteExpiresAt ? isPast(new Date(inviteExpiresAt)) : false;

  const inviteUrl = inviteToken 
    ? `${window.location.origin}/join?token=${inviteToken}`
    : "";

  const copyToClipboard = async () => {
    if (!inviteUrl) return;
    
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast({ title: "Lenke kopiert!" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Kunne ikke kopiere", variant: "destructive" });
    }
  };

  const regenerateToken = async () => {
    if (!household) return;
    
    setIsRegenerating(true);
    try {
      const { error } = await supabase.rpc("regenerate_invite_token", {
        _household_id: household.id,
      });

      if (error) throw error;

      toast({ title: "Ny invitasjonslenke generert" });
      onUpdate();
    } catch (error) {
      console.error("Error regenerating token:", error);
      toast({ title: "Kunne ikke generere ny lenke", variant: "destructive" });
    } finally {
      setIsRegenerating(false);
    }
  };

  const setExpiry = async (days: number | null) => {
    if (!household) return;
    setIsSettingExpiry(true);
    try {
      if (days === null) {
        const { error } = await supabase.rpc("clear_invite_expiry", { _household_id: household.id });
        if (error) throw error;
        toast({ title: "Utløpsdato fjernet" });
      } else {
        const { error } = await supabase.rpc("set_invite_expiry", { _household_id: household.id, _days: days });
        if (error) throw error;
        toast({ title: `Invitasjonen utløper om ${days} dager` });
      }
      onUpdate();
    } catch (error) {
      console.error("Error setting expiry:", error);
      toast({ title: "Kunne ikke oppdatere utløpsdato", variant: "destructive" });
    } finally {
      setIsSettingExpiry(false);
    }
  };

  const toggleInviteEnabled = async (enabled: boolean) => {
    if (!household) return;
    
    setIsUpdatingEnabled(true);
    try {
      const { error } = await supabase
        .from("households")
        .update({ invite_enabled: enabled })
        .eq("id", household.id);

      if (error) throw error;

      toast({ title: enabled ? "Invitasjoner aktivert" : "Invitasjoner deaktivert" });
      onUpdate();
    } catch (error) {
      console.error("Error toggling invite:", error);
      toast({ title: "Kunne ikke oppdatere innstilling", variant: "destructive" });
    } finally {
      setIsUpdatingEnabled(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Inviter medlemmer
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Inviter til {household?.name}
          </DialogTitle>
          <DialogDescription>
            Del denne lenken med noen for å la dem bli med i husholdningen din.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Tillat invitasjoner</Label>
              <p className="text-xs text-muted-foreground">
                Når deaktivert vil ingen kunne bruke lenken
              </p>
            </div>
            <Switch
              checked={inviteEnabled}
              onCheckedChange={toggleInviteEnabled}
              disabled={isUpdatingEnabled}
            />
          </div>

          {/* Invite Link */}
          {inviteEnabled && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Invitasjonslenke</Label>
              <div className="flex gap-2">
                <Input
                  value={inviteUrl}
                  readOnly
                  className="text-xs font-mono"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={copyToClipboard}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={regenerateToken}
                disabled={isRegenerating}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`} />
                Generer ny lenke (ugyldiggjør gammel)
              </Button>

              {/* Expiry */}
              <div className="space-y-2 pt-1 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {inviteExpiresAt ? (
                      <span className={isExpired ? "text-destructive" : "text-muted-foreground"}>
                        {isExpired ? "Utløpt" : "Utløper"}{" "}
                        {format(new Date(inviteExpiresAt), "d. MMM yyyy", { locale: nb })}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Ingen utløpsdato</span>
                    )}
                  </div>
                  {inviteExpiresAt && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setExpiry(null)}
                      disabled={isSettingExpiry}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  {[7, 14, 30].map(days => (
                    <Button
                      key={days}
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs h-7"
                      onClick={() => setExpiry(days)}
                      disabled={isSettingExpiry}
                    >
                      {days}d
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Nye medlemmer vil automatisk få tilgang til å se og legge til kvitteringer, 
            og vil bli inkludert i oppgjørsberegningen.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
