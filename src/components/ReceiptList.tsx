import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Receipt, ScrollText, Trash2, ChevronRight, Store, User, Users, AlertTriangle, AlertCircle, Ban, Pencil, Check, Tag, Search, X, ZoomIn } from "lucide-react";
import { useMonthlyReceipts, useDeleteReceipt, useCategories, useUpdateReceiptPayer, useUpdateReceipt } from "@/hooks/useBudgetData";
import { useSettlementNames } from "@/hooks/useSettlements";
import { useSettlementContext } from "@/contexts/SettlementContext";
import { useHousehold } from "@/contexts/HouseholdContext";
import { Receipt as ReceiptType } from "@/types/budget";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { formatNOK } from "@/lib/format";
import { Label } from "@/components/ui/label";
import { ReceiptItemEditor } from "@/components/ReceiptItemEditor";
import { ReceiptImage } from "@/components/ReceiptImage";
import { QueryErrorState } from "@/components/QueryErrorState";

export function ReceiptList() {
  const { data: receipts, isLoading, isError, error, refetch } = useMonthlyReceipts();
  const { data: categories } = useCategories();
  const { members } = useHousehold();
  const { data: settlementNames } = useSettlementNames();
  const { activeSettlement } = useSettlementContext();

  /**
   * The list is no longer settlement-scoped, so a row can belong to another
   * settlement or to none at all. Badge only those two cases — badging every
   * row when they all sit in the active settlement would be pure noise.
   */
  const settlementBadge = (receipt: ReceiptType): string | null => {
    if (!receipt.settlement_id) return "Ikke i oppgjør";
    if (receipt.settlement_id === activeSettlement?.id) return null;
    return settlementNames?.[receipt.settlement_id] ?? "Annet oppgjør";
  };
  const deleteReceipt = useDeleteReceipt();
  const updateReceiptPayer = useUpdateReceiptPayer();
  const updateReceipt = useUpdateReceipt();
  // The header search box navigates to /kvitteringer?q=… rather than holding a
  // second copy of the query. Seed the existing filter from it; typing in the
  // box below stays local, so the two never fight over the same value.
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";

  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptType | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editStoreName, setEditStoreName] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTotal, setEditTotal] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [editStoreChain, setEditStoreChain] = useState("");
  const [search, setSearch] = useState(urlQuery);

  // Adjusted during render rather than in an effect: an effect here sets state
  // synchronously on every ?q= change and cascades an extra render pass. React
  // re-runs this component immediately instead, without committing the first
  // result. On routes with no ?q= both values stay "" and this never fires.
  const [lastUrlQuery, setLastUrlQuery] = useState(urlQuery);
  if (urlQuery !== lastUrlQuery) {
    setLastUrlQuery(urlQuery);
    setSearch(urlQuery);
  }
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  // Find the current receipt from the data (for real-time updates)
  const currentReceipt = useMemo(() => {
    if (!selectedReceipt || !receipts) return null;
    return receipts.find(r => r.id === selectedReceipt.id) || selectedReceipt;
  }, [selectedReceipt, receipts]);

  // Calculate included subtotal for the current receipt
  const includedSubtotal = useMemo(() => {
    if (!currentReceipt?.items || currentReceipt.items.length === 0) return null;
    return currentReceipt.items
      .filter(item => item.included_in_totals !== false)
      .reduce((sum, item) => sum + Number(item.price), 0);
  }, [currentReceipt?.items]);

  const excludedCount = useMemo(() => {
    if (!currentReceipt?.items) return 0;
    return currentReceipt.items.filter(item => item.included_in_totals === false).length;
  }, [currentReceipt?.items]);

  const filteredReceipts = useMemo(() => {
    if (!receipts) return [];
    const q = search.trim().toLowerCase();
    if (!q) return receipts;
    return receipts.filter(r => {
      const label = r.label?.toLowerCase() ?? "";
      return (
        (r.store_name?.toLowerCase().includes(q)) ||
        label.includes(q)
      );
    });
  }, [receipts, search]);

  const handlePayerChange = async (receiptId: string, paidByUser: string) => {
    await updateReceiptPayer.mutateAsync({ receiptId, paidByUser });
  };

  const startEdit = (receipt: ReceiptType) => {
    setEditStoreName(receipt.store_name || "");
    setEditStoreChain(receipt.store_chain || "");
    setEditDate(receipt.receipt_date?.split("T")[0] || "");
    setEditTotal(String(Number(receipt.total_amount)));
    setEditLabel(receipt.label || "");
    setEditMode(true);
  };

  const saveEdit = async () => {
    if (!currentReceipt) return;
    const total = parseFloat(editTotal.replace(",", "."));
    await updateReceipt.mutateAsync({
      receiptId: currentReceipt.id,
      updates: {
        store_name: editStoreName || undefined,
        store_chain: editStoreChain.trim().toLowerCase() || null,
        receipt_date: editDate || undefined,
        total_amount: isNaN(total) ? undefined : total,
        label: editLabel.trim() || null,
      },
    });
    setEditMode(false);
  };

  const getMemberName = (userId: string | null) => {
    if (!userId) return null;
    const member = members.find(m => m.user_id === userId);
    return member?.profile?.display_name || member?.profile?.email?.split("@")[0] || "Ukjent";
  };

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <div className="h-5 bg-muted rounded w-32 animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 bg-muted rounded-lg animate-pulse"
            />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-card">
        <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg font-display">Kvitteringer</CardTitle>
            <ScrollText className="h-5 w-5 text-muted-foreground" />
          </div>
          {/* `|| search` matters: a term arriving from the header search would
              otherwise filter a short list with no visible input and no way to
              clear it. */}
          {((receipts && receipts.length > 3) || search) && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Søk butikk eller etikett…"
                className="pl-8 pr-8 h-8 text-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          {isError ? (
            <QueryErrorState what="kvitteringene" error={error} onRetry={() => refetch()} />
          ) : !receipts || receipts.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <Receipt className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground mt-2">
                Ingen kvitteringer denne måneden
              </p>
            </div>
          ) : filteredReceipts.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">Ingen treff på «{search}»</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredReceipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 active:bg-accent transition-colors cursor-pointer group min-h-[56px]"
                  onClick={() => setSelectedReceipt(receipt)}
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
                      <Store className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm sm:text-base truncate">
                          {receipt.store_name || "Ukjent butikk"}
                        </p>
                        {!receipt.paid_by_user && (
                          <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />
                        )}
                        {receipt.label && (
                          <Badge variant="secondary" className="text-xs h-5 gap-1 shrink-0">
                            <Tag className="h-2.5 w-2.5" />
                            {receipt.label}
                          </Badge>
                        )}
                        {settlementBadge(receipt) && (
                          <Badge variant="outline" className="text-xs h-5 gap-1 shrink-0 text-muted-foreground">
                            <Users className="h-2.5 w-2.5" />
                            {settlementBadge(receipt)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(receipt.receipt_date), "d. MMM", { locale: nb })}
                        {receipt.paid_by_user && (
                          <span className="ml-1.5">
                            • Betalt av {getMemberName(receipt.paid_by_user)}
                          </span>
                        )}
                        {receipt.items && receipt.items.length > 0 && (
                          <span className="ml-1.5">
                            • {receipt.items.length} varer
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    <span className="font-semibold tabular-nums text-sm sm:text-base">
                      {formatNOK(Number(receipt.total_amount))}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-50 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipt Detail Dialog */}
      <Dialog
        open={!!selectedReceipt}
        onOpenChange={(open) => { if (!open) { setSelectedReceipt(null); setEditMode(false); } }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              {editMode ? (
                <Input
                  value={editStoreName}
                  onChange={e => setEditStoreName(e.target.value)}
                  className="h-7 text-base font-semibold"
                  placeholder="Butikknavn"
                  autoFocus
                />
              ) : (
                <span className="truncate">{currentReceipt?.store_name || "Kvitteringsdetaljer"}</span>
              )}
              {!editMode ? (
                <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto shrink-0" onClick={() => currentReceipt && startEdit(currentReceipt)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto shrink-0" onClick={saveEdit} disabled={updateReceipt.isPending}>
                  <Check className="h-3.5 w-3.5 text-green-600" />
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          {currentReceipt && (
            <div className="space-y-4">
              {/* Header with totals */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  {editMode ? (
                    <Input
                      type="date"
                      value={editDate}
                      onChange={e => setEditDate(e.target.value)}
                      className="h-8 text-sm w-auto"
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(currentReceipt.receipt_date), "d. MMMM yyyy", { locale: nb })}
                    </span>
                  )}
                  <div className="text-right shrink-0">
                    {includedSubtotal !== null && includedSubtotal !== Number(currentReceipt.total_amount) && (
                      <div className="text-xs text-muted-foreground line-through">
                        Skannet: {formatNOK(Number(currentReceipt.total_amount))}
                      </div>
                    )}
                    {editMode ? (
                      <Input
                        value={editTotal}
                        onChange={e => setEditTotal(e.target.value)}
                        className="h-8 text-right font-bold w-32"
                        placeholder="0.00"
                      />
                    ) : (
                      <span className="text-xl font-bold tabular-nums">
                        {formatNOK(includedSubtotal ?? Number(currentReceipt.total_amount))}
                      </span>
                    )}
                  </div>
                </div>
                {excludedCount > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Ban className="h-3 w-3" />
                    <span>{excludedCount} vare{excludedCount > 1 ? 'r' : ''} ekskludert fra totaler</span>
                  </div>
                )}
                {editMode ? (
                  <div className="space-y-1.5 mt-1">
                    <div className="flex items-center gap-2">
                      <Store className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <Input
                        value={editStoreChain}
                        onChange={e => setEditStoreChain(e.target.value)}
                        className="h-7 text-sm"
                        placeholder="Kjede (f.eks. rema 1000, kiwi)"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <Input
                        value={editLabel}
                        onChange={e => setEditLabel(e.target.value)}
                        className="h-7 text-sm"
                        placeholder="Etikett (valgfri)"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {currentReceipt.store_chain ? (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Store className="h-3 w-3" />
                        <span>{currentReceipt.store_chain}</span>
                      </div>
                    ) : (
                      <button
                        className="flex items-center gap-1.5 text-xs text-warning hover:text-warning/80 transition-colors"
                        onClick={() => currentReceipt && startEdit(currentReceipt)}
                      >
                        <Store className="h-3 w-3" />
                        <span>Sett kjede for prisdeling</span>
                      </button>
                    )}
                    {currentReceipt.label && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Tag className="h-3 w-3" />
                        <span>{currentReceipt.label}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Attribution info */}
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 p-3 rounded-lg bg-muted/50 border">
                {currentReceipt.created_by_user && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Lagt til av:</span>
                    <span className="font-medium">{getMemberName(currentReceipt.created_by_user)}</span>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Betalt av</Label>
                  <Select 
                    value={currentReceipt.paid_by_user || ""} 
                    onValueChange={(v) => handlePayerChange(currentReceipt.id, v)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Velg betaler" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((member) => (
                        <SelectItem key={member.user_id} value={member.user_id}>
                          {member.profile?.display_name || member.profile?.email || "Ukjent"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {currentReceipt.image_url && (
                <button
                  className="relative w-full group"
                  onClick={() => setFullscreenImage(currentReceipt.image_url!)}
                >
                  <ReceiptImage
                    src={currentReceipt.image_url}
                    className="w-full rounded-lg max-h-48 object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 group-hover:bg-black/30 transition-colors">
                    <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              )}

              {currentReceipt.items && currentReceipt.items.length > 0 && categories && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Varer ({currentReceipt.items.length})</h4>
                    {currentReceipt.items.some(i => i.needs_review && i.included_in_totals !== false) && (
                      <span className="text-xs text-warning flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {currentReceipt.items.filter(i => i.needs_review && i.included_in_totals !== false).length} trenger gjennomgang
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {currentReceipt.items.map((item) => (
                      <ReceiptItemEditor
                        key={item.id}
                        item={item}
                        categories={categories}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Slett kvittering
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Slette denne kvitteringen?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Dette vil fjerne {formatNOK(includedSubtotal ?? Number(currentReceipt.total_amount))} fra forbruket ditt. Denne handlingen kan ikke angres.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Avbryt</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          await deleteReceipt.mutateAsync(currentReceipt.id);
                          setSelectedReceipt(null);
                        }}
                      >
                        Slett
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Fullscreen image dialog */}
      <Dialog open={!!fullscreenImage} onOpenChange={(open) => { if (!open) setFullscreenImage(null); }}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Kvitteringsbilde</DialogTitle>
          </DialogHeader>
          {fullscreenImage && (
            <ReceiptImage
              src={fullscreenImage}
              className="w-full h-full object-contain max-h-[90vh] rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
