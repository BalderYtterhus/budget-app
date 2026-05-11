import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Store, 
  TrendingDown, 
  AlertTriangle, 
  ChevronRight, 
  Trophy,
  BarChart3,
  Loader2
} from "lucide-react";
import { useStoreComparison, StorePriceData } from "@/hooks/useStorePrices";
import { ShoppingListItem } from "@/types/budget";
import { formatNOK } from "@/lib/format";
import { cn } from "@/lib/utils";

interface StoreComparisonProps {
  items: ShoppingListItem[];
}

export function StoreComparison({ items }: StoreComparisonProps) {
  const { data: comparison, isLoading } = useStoreComparison(items);

  if (items.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!comparison || comparison.stores.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center gap-2 px-4 sm:px-6 pt-4 sm:pt-6 pb-3">
          <Store className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base sm:text-lg font-display">Prissammenligning</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <p className="text-sm text-muted-foreground">
            Ingen prishistorikk tilgjengelig. Legg til kvitteringer med butikknavn for å aktivere prissammenligning.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { stores, cheapestStore, hasEnoughData } = comparison;

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6 pb-3">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          <CardTitle className="text-base sm:text-lg font-display">Prissammenligning</CardTitle>
        </div>
        <Link to="/store-comparison">
          <Button variant="ghost" size="sm" className="gap-1 text-xs">
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Detaljer</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
        {/* Warning if coverage is low */}
        {!hasEnoughData && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Estimatet kan være upålitelig på grunn av begrenset prishistorikk.
            </p>
          </div>
        )}

        {/* Cheapest store highlight */}
        {cheapestStore && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium">Billigste butikk</p>
                  <Badge variant="secondary" className="text-xs">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    Lavest total
                  </Badge>
                </div>
                <p className="text-lg font-bold mt-1">{cheapestStore.storeName}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-primary tabular-nums">
                    {formatNOK(cheapestStore.totalEstimate)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    estimert total
                  </span>
                </div>
                <CoverageInfo store={cheapestStore} />
              </div>
            </div>
          </div>
        )}

        {/* Other stores list */}
        {stores.length > 1 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Andre butikker
            </p>
            <div className="space-y-2">
              {stores.slice(1).map((store) => (
                <StoreRow 
                  key={store.normalizedName} 
                  store={store} 
                  cheapestTotal={cheapestStore?.totalEstimate ?? 0}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StoreRow({ store, cheapestTotal }: { store: StorePriceData; cheapestTotal: number }) {
  const difference = store.totalEstimate - cheapestTotal;
  const percentMore = cheapestTotal > 0 ? (difference / cheapestTotal) * 100 : 0;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm truncate">{store.storeName}</p>
        <CoverageInfo store={store} compact />
      </div>
      <div className="text-right shrink-0 ml-3">
        <p className="font-semibold tabular-nums">{formatNOK(store.totalEstimate)}</p>
        {difference > 0 && (
          <p className="text-xs text-muted-foreground">
            +{formatNOK(difference)} ({percentMore.toFixed(0)}% mer)
          </p>
        )}
      </div>
    </div>
  );
}

function CoverageInfo({ store, compact = false }: { store: StorePriceData; compact?: boolean }) {
  const coverageClass = store.coveragePercent >= 70 
    ? "text-success" 
    : store.coveragePercent >= 50 
      ? "text-warning" 
      : "text-muted-foreground";

  if (compact) {
    return (
      <p className="text-xs text-muted-foreground">
        {store.knownItemCount} av {store.knownItemCount + store.unknownItemCount} varer
        <span className={cn("ml-1", coverageClass)}>
          ({store.coveragePercent.toFixed(0)}%)
        </span>
      </p>
    );
  }

  return (
    <p className="text-xs text-muted-foreground mt-1">
      Priser funnet for {store.knownItemCount} av {store.knownItemCount + store.unknownItemCount} varer
      <span className={cn("ml-1", coverageClass)}>
        ({store.coveragePercent.toFixed(0)}% dekning)
      </span>
    </p>
  );
}
