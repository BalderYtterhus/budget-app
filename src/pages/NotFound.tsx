import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Loader2, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppLayout } from "@/components/AppLayout";
import { HouseholdProvider } from "@/contexts/HouseholdContext";
import { SettlementProvider } from "@/contexts/SettlementContext";
import { useAuth } from "@/contexts/AuthContext";

function NotFoundCard({ standalone }: { standalone?: boolean }) {
  const location = useLocation();

  return (
    <Card className="shadow-card">
      <CardContent className="flex flex-col items-center text-center gap-4 py-10 px-4 sm:px-6">
        <div className="p-3 rounded-full bg-muted">
          <Compass className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-semibold font-display">Siden finnes ikke</p>
          <p className="text-sm text-muted-foreground">
            Vi fant ingenting på{" "}
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded break-all">
              {location.pathname}
            </code>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <Button asChild>
            <Link to="/">Til oversikten</Link>
          </Button>
          {standalone ? (
            <Button variant="outline" asChild>
              <Link to="/auth">Logg inn</Link>
            </Button>
          ) : (
            <Button variant="outline" asChild>
              <Link to="/kvitteringer">Til kvitteringer</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 404.
 *
 * Rendered inside the app shell when signed in, so the sidebar, month picker
 * and upload sheet stay reachable — a mistyped URL used to drop the user onto a
 * bare page whose only way out was a full-reload `<a href="/">`. Signed-out
 * visitors get the card on its own, since the shell needs a household.
 */
const NotFound = () => {
  const location = useLocation();
  const { user, loading } = useAuth();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <NotFoundCard standalone />
        </div>
      </div>
    );
  }

  return (
    <HouseholdProvider>
      <SettlementProvider>
        <AppLayout title="Siden finnes ikke">
          <NotFoundCard />
        </AppLayout>
      </SettlementProvider>
    </HouseholdProvider>
  );
};

export default NotFound;
