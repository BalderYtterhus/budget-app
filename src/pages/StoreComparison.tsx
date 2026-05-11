import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Store, 
  Trophy, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";
import { useShoppingList } from "@/hooks/useShoppingList";
import { useDetailedStoreComparison } from "@/hooks/useStorePrices";
import { formatNOK } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function StoreComparisonPage() {
  const { data: items = [], isLoading: itemsLoading } = useShoppingList();
  const comparison = useDetailedStoreComparison(items);

  if (itemsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <BackButton />
          <Card className="mt-4">
            <CardContent className="py-12 text-center">
              <Store className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="text-muted-foreground mt-4">
                Handlelisten er tom. Legg til varer for å sammenligne priser.
              </p>
              <Link to="/">
                <Button className="mt-4">Gå til handlelisten</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!comparison || comparison.stores.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <BackButton />
          <Card className="mt-4">
            <CardContent className="py-12 text-center">
              <Store className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="text-muted-foreground mt-4">
                Ingen prishistorikk tilgjengelig. Legg til kvitteringer med butikknavn for å aktivere prissammenligning.
              </p>
              <Link to="/">
                <Button className="mt-4">Gå tilbake</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { stores, itemRows, cheapestStore, hasEnoughData } = comparison;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <BackButton />

        {/* Header */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-display">Detaljert prissammenligning</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Warning */}
            {!hasEnoughData && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Estimatene kan være upålitelige på grunn av begrenset prishistorikk. 
                  Jo flere kvitteringer du legger til, jo bedre blir sammenligningen.
                </p>
              </div>
            )}

            {/* Recommendation */}
            {cheapestStore && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">
                      Anbefalt butikk: <span className="text-primary">{cheapestStore.storeName}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Estimert total: {formatNOK(cheapestStore.totalEstimate)} 
                      ({cheapestStore.coveragePercent.toFixed(0)}% av varene har kjent pris)
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Store totals summary */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">Butikkoversikt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stores.map((store, index) => {
                const isCheapest = index === 0;
                const difference = index > 0 ? store.totalEstimate - stores[0].totalEstimate : 0;

                return (
                  <div 
                    key={store.normalizedName}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      isCheapest && "bg-primary/5 border-primary/20"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {isCheapest && <Trophy className="h-4 w-4 text-primary" />}
                      <div>
                        <p className="font-medium text-sm">{store.storeName}</p>
                        <p className="text-xs text-muted-foreground">
                          {store.knownItemCount} priser funnet ({store.coveragePercent.toFixed(0)}%)
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn("font-semibold tabular-nums", isCheapest && "text-primary")}>
                        {formatNOK(store.totalEstimate)}
                      </p>
                      {difference > 0 && (
                        <p className="text-xs text-muted-foreground">+{formatNOK(difference)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Per-item breakdown */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">Pris per vare</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Mobile view: stacked cards */}
            <div className="sm:hidden divide-y">
              {itemRows.map(({ item, storePrices, cheapestStore: cheapestForItem }) => (
                <div key={item.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{item.name}</p>
                    <Badge variant="outline" className="text-xs">
                      ×{item.quantity}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {stores.map((store) => {
                      const price = storePrices[store.normalizedName];
                      const isCheapest = store.normalizedName === cheapestForItem;

                      return (
                        <div 
                          key={store.normalizedName}
                          className={cn(
                            "p-2 rounded border text-center",
                            isCheapest && price !== null && "bg-primary/5 border-primary/20"
                          )}
                        >
                          <p className="text-xs text-muted-foreground truncate">
                            {store.storeName}
                          </p>
                          {price !== null ? (
                            <p className={cn(
                              "font-medium tabular-nums text-sm",
                              isCheapest && "text-primary"
                            )}>
                              {formatNOK(price * item.quantity)}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">Ukjent</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop view: table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium text-sm">Vare</th>
                    <th className="text-center p-3 font-medium text-sm w-16">Antall</th>
                    {stores.map((store) => (
                      <th 
                        key={store.normalizedName} 
                        className="text-right p-3 font-medium text-sm min-w-[100px]"
                      >
                        <div className="flex items-center justify-end gap-1">
                          {store.normalizedName === stores[0]?.normalizedName && (
                            <Trophy className="h-3.5 w-3.5 text-primary" />
                          )}
                          <span className="truncate max-w-[100px]">{store.storeName}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {itemRows.map(({ item, storePrices, cheapestStore: cheapestForItem }) => (
                    <tr key={item.id} className="hover:bg-muted/50">
                      <td className="p-3">
                        <p className="font-medium text-sm">{item.name}</p>
                        {item.category && (
                          <p className="text-xs text-muted-foreground">{item.category.name}</p>
                        )}
                      </td>
                      <td className="p-3 text-center tabular-nums">{item.quantity}</td>
                      {stores.map((store) => {
                        const price = storePrices[store.normalizedName];
                        const isCheapest = store.normalizedName === cheapestForItem;

                        return (
                          <td 
                            key={store.normalizedName} 
                            className={cn(
                              "p-3 text-right",
                              isCheapest && price !== null && "bg-primary/5"
                            )}
                          >
                            {price !== null ? (
                              <div className="flex items-center justify-end gap-1">
                                {isCheapest && (
                                  <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                                )}
                                <span className={cn(
                                  "tabular-nums",
                                  isCheapest && "font-medium text-primary"
                                )}>
                                  {formatNOK(price * item.quantity)}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1 text-muted-foreground">
                                <XCircle className="h-3.5 w-3.5" />
                                <span className="text-xs">Ukjent</span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-muted/50 font-semibold">
                    <td className="p-3" colSpan={2}>Total</td>
                    {stores.map((store, index) => (
                      <td 
                        key={store.normalizedName} 
                        className={cn(
                          "p-3 text-right tabular-nums",
                          index === 0 && "text-primary"
                        )}
                      >
                        {formatNOK(store.totalEstimate)}
                      </td>
                    ))}
                  </tr>
                  <tr className="text-xs text-muted-foreground">
                    <td className="px-3 pb-3" colSpan={2}>Dekning</td>
                    {stores.map((store) => (
                      <td key={store.normalizedName} className="px-3 pb-3 text-right">
                        {store.knownItemCount}/{store.knownItemCount + store.unknownItemCount} 
                        ({store.coveragePercent.toFixed(0)}%)
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BackButton() {
  return (
    <Link to="/">
      <Button variant="ghost" size="sm" className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Tilbake til handlelisten
      </Button>
    </Link>
  );
}
