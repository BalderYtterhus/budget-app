import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QueryErrorStateProps {
  /** What failed to load, in Norwegian, lowercase — e.g. "kvitteringene". */
  what: string;
  error?: unknown;
  onRetry?: () => void;
}

/**
 * Shown when a query fails, so a failure is never mistaken for "no data".
 *
 * Every list in the app previously rendered its empty state on error, which
 * made two separate outages invisible: an ambiguous PostgREST embed returning
 * HTTP 300, and settlements hidden by an RLS policy. Both looked exactly like
 * an empty month.
 */
export function QueryErrorState({ what, error, onRetry }: QueryErrorStateProps) {
  const detail = error instanceof Error ? error.message : null;

  return (
    <div className="text-center py-6 sm:py-8 px-4">
      <AlertTriangle className="h-8 w-8 mx-auto text-destructive/70" />
      <p className="text-sm font-medium mt-2">Kunne ikke laste {what}</p>
      <p className="text-xs text-muted-foreground mt-1">
        Dette er en feil, ikke tomme data. Prøv igjen, eller sjekk konsollen for detaljer.
      </p>
      {detail && (
        <p className="text-[11px] text-muted-foreground/70 mt-2 font-mono break-words max-w-sm mx-auto">
          {detail}
        </p>
      )}
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-3 gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Prøv igjen
        </Button>
      )}
    </div>
  );
}
