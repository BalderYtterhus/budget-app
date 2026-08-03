import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Home, CheckCircle, XCircle, LogIn, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const JoinHousehold = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<"loading" | "success" | "already_member" | "error" | "expired" | "need_auth">("loading");
  const [householdName, setHouseholdName] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const inviteToken = searchParams.get("token");

  // Guards against joining more than once for the same token. StrictMode runs
  // effects twice in dev, and the effect also re-fires whenever the user object
  // changes identity (e.g. a token refresh). Without this the RPC runs again,
  // returns already_member, and overwrites the success state — so a successful
  // join reports "du er allerede medlem" instead.
  const attemptedTokenRef = useRef<string | null>(null);

  const joinHousehold = useCallback(async () => {
    if (!inviteToken) return;

    try {
      const { data, error } = await supabase.rpc("join_household_via_invite", {
        _invite_token: inviteToken,
      });

      if (error) throw error;

      const result = data as { success: boolean; already_member?: boolean; household_name?: string; error?: string };

      if (!result.success) {
        if (result.error?.includes("utløpt")) {
          setStatus("expired");
        } else {
          setStatus("error");
          setErrorMessage(result.error || "Kunne ikke bli med i husholdningen");
        }
        return;
      }

      setHouseholdName(result.household_name || "");
      
      if (result.already_member) {
        setStatus("already_member");
      } else {
        setStatus("success");
        toast({ title: `Du ble med i "${result.household_name}"!` });
      }
    } catch (error) {
      console.error("Error joining household:", error);
      setStatus("error");
      setErrorMessage("Noe gikk galt. Prøv igjen senere.");
    }
  }, [inviteToken, toast]);

  useEffect(() => {
    if (authLoading) return;

    if (!inviteToken) {
      setStatus("error");
      setErrorMessage("Ugyldig invitasjonslenke");
      return;
    }

    if (!user) {
      setStatus("need_auth");
      return;
    }

    if (attemptedTokenRef.current === inviteToken) return;
    attemptedTokenRef.current = inviteToken;

    joinHousehold();
  }, [inviteToken, user, authLoading, joinHousehold]);

  const handleGoToDashboard = () => {
    // Force a full page reload to refresh household context
    window.location.href = "/";
  };

  const handleGoToLogin = () => {
    // Store the invite token to use after login
    sessionStorage.setItem("pending_invite_token", inviteToken || "");
    navigate("/auth");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Home className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Bli med i husholdning</CardTitle>
          <CardDescription>
            Du har blitt invitert til å dele et matbudsjett
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "loading" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Kobler til husholdning...</p>
            </div>
          )}

          {status === "need_auth" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <LogIn className="h-12 w-12 text-muted-foreground" />
              <p className="text-center text-muted-foreground">
                Du må logge inn eller registrere deg for å bli med i husholdningen.
              </p>
              <Button onClick={handleGoToLogin} className="w-full">
                Logg inn / Registrer deg
              </Button>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <CheckCircle className="h-12 w-12 text-primary" />
              <div className="text-center">
                <p className="font-medium text-lg">Velkommen!</p>
                <p className="text-muted-foreground">
                  Du er nå medlem av "{householdName}"
                </p>
              </div>
              <Button onClick={handleGoToDashboard} className="w-full">
                Gå til budsjettet
              </Button>
            </div>
          )}

          {status === "already_member" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <CheckCircle className="h-12 w-12 text-primary" />
              <div className="text-center">
                <p className="font-medium text-lg">Allerede medlem</p>
                <p className="text-muted-foreground">
                  Du er allerede med i "{householdName}"
                </p>
              </div>
              <Button onClick={handleGoToDashboard} className="w-full">
                Gå til budsjettet
              </Button>
            </div>
          )}

          {status === "expired" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <Clock className="h-12 w-12 text-warning" />
              <div className="text-center space-y-1">
                <p className="font-medium text-lg">Lenken har utløpt</p>
                <p className="text-muted-foreground text-sm">
                  Invitasjonslenken er ikke lenger gyldig. Be eieren av husholdningen om å sende en ny lenke.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Eieren kan sette en ny utløpsdato i Innstillinger → Inviter medlemmer.
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate("/")} className="w-full">
                Gå til forsiden
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <XCircle className="h-12 w-12 text-destructive" />
              <div className="text-center">
                <p className="font-medium text-lg">Noe gikk galt</p>
                <p className="text-muted-foreground">{errorMessage}</p>
              </div>
              <Button variant="outline" onClick={() => navigate("/")} className="w-full">
                Gå til forsiden
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinHousehold;
