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
import { Copy, RefreshCw, Link, Check, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HouseholdInviteProps {
  inviteToken: string | null;
  inviteEnabled: boolean;
  onUpdate: () => void;
}

export function HouseholdInvite({ inviteToken, inviteEnabled, onUpdate }: HouseholdInviteProps) {
  const { household } = useHousehold();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isUpdatingEnabled, setIsUpdatingEnabled] = useState(false);

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
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Inviter medlemmer
        </Button>
      </DialogTrigger>
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
