import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useHousehold } from "@/contexts/HouseholdContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Loader2, LogOut, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/** Matches the uuid in an invite link, or a bare uuid pasted on its own. */
const TOKEN_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/**
 * Shown when an authenticated user has no household.
 *
 * The signup trigger `on_auth_user_created` creates one, so this state is only
 * reachable when that trigger failed or when the user left their household —
 * but until now nothing handled it. The app rendered normally against
 * `household === null`, and the first thing that dereferenced it was
 * `ReceiptUpload`'s `household!.id`, which threw mid-upload after the user had
 * already picked a photo.
 *
 * Both actions here are what the trigger and the invite RPC already do, so no
 * new schema or policy is involved: households INSERT allows any authenticated
 * user, and household_memberships INSERT allows `auth.uid() = user_id`.
 */
export function NoHousehold() {
  const { user, signOut } = useAuth();
  const { refetchHousehold } = useHousehold();
  const { toast } = useToast();
  const navigate = useNavigate();

  const defaultName = user?.email ? `${user.email.split("@")[0]}s husholdning` : "Min husholdning";
  const [name, setName] = useState(defaultName);
  const [inviteInput, setInviteInput] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!user || !name.trim()) return;
    setCreating(true);
    try {
      // The id is generated here rather than read back from the insert: the
      // SELECT policy on households is membership-based, and the membership
      // does not exist yet, so a `.select()` on the insert returns nothing.
      const householdId = crypto.randomUUID();

      const { error: householdError } = await supabase
        .from("households")
        .insert({ id: householdId, name: name.trim() });
      if (householdError) throw householdError;

      const { error: membershipError } = await supabase
        .from("household_memberships")
        .insert({ household_id: householdId, user_id: user.id, role: "owner" });
      if (membershipError) throw membershipError;

      await refetchHousehold();
      toast({ title: `"${name.trim()}" opprettet!` });
    } catch (error) {
      console.error("Error creating household:", error);
      toast({
        title: "Kunne ikke opprette husholdning",
        description: "Prøv igjen, eller logg ut og inn på nytt.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = () => {
    const token = inviteInput.match(TOKEN_RE)?.[0];
    if (!token) {
      toast({
        title: "Fant ingen invitasjonskode",
        description: "Lim inn hele lenken du fikk tilsendt.",
        variant: "destructive",
      });
      return;
    }
    navigate(`/join?token=${token}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Home className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Ingen husholdning</CardTitle>
          <CardDescription>
            Kontoen din er ikke koblet til en husholdning. Opprett en ny, eller bli med
            i en du har blitt invitert til.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Create */}
          <div className="space-y-2">
            <Label htmlFor="household-name">Opprett ny husholdning</Label>
            <div className="flex gap-2">
              <Input
                id="household-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="f.eks. Balder og Alani"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                className="flex-1"
              />
              <Button onClick={handleCreate} disabled={creating || !name.trim()}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Opprett"}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">eller</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Join */}
          <div className="space-y-2">
            <Label htmlFor="invite-link" className="flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5" />
              Bli med via invitasjonslenke
            </Label>
            <div className="flex gap-2">
              <Input
                id="invite-link"
                value={inviteInput}
                onChange={(e) => setInviteInput(e.target.value)}
                placeholder="Lim inn lenken du fikk"
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                className="flex-1 text-xs"
              />
              <Button variant="outline" onClick={handleJoin} disabled={!inviteInput.trim()}>
                Bli med
              </Button>
            </div>
          </div>

          <div className="pt-2 border-t">
            <Button variant="ghost" size="sm" className="w-full gap-2" onClick={signOut}>
              <LogOut className="h-4 w-4" />
              Logg ut
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
