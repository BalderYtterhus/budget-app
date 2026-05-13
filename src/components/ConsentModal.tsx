import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, BarChart2, EyeOff } from "lucide-react";

export function ConsentModal() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("price_sharing_enabled")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        // Show modal only if the user hasn't answered yet
        if (data && data.price_sharing_enabled === null) setOpen(true);
      });
  }, [user]);

  const handleChoice = async (enabled: boolean) => {
    if (!user) return;
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ price_sharing_enabled: enabled })
      .eq("user_id", user.id);
    setSaving(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-sm" onPointerDownOutside={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Del prisdata anonymt?
          </DialogTitle>
          <DialogDescription className="sr-only">
            Samtykke til anonym prisdeling
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            Vi vil gjerne samle inn anonyme prisdata fra kvitteringene dine for å
            bygge en felles prisdatabase. Dette hjelper alle brukere å sammenligne
            priser og spore prisvekst over tid.
          </p>

          <div className="space-y-2.5">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <EyeOff className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-0.5">Ingen persondata</p>
                Kun butikknavn, produktnavn og pris. Ingen bruker-ID, navn eller
                annen informasjon som kan spores tilbake til deg.
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <BarChart2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-0.5">Hva vi samler inn</p>
                Butikkjede (f.eks. «rema 1000»), produktnavn (f.eks. «helmelk»),
                pris, dato og kategori.
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Du kan endre valget ditt når som helst under innstillinger.
          </p>

          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleChoice(false)}
              disabled={saving}
            >
              Nei takk
            </Button>
            <Button
              className="flex-1"
              onClick={() => handleChoice(true)}
              disabled={saving}
            >
              Godta
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
