import { useState, useMemo } from "react";
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
import { Receipt, ScrollText, Trash2, ChevronRight, Store, User, AlertTriangle, AlertCircle, Ban, Pencil, Check, Tag } from "lucide-react";
import { useMonthlyReceipts, useDeleteReceipt, useCategories, useUpdateReceiptPayer, useUpdateReceipt } from "@/hooks/useBudgetData";
import { useHousehold } from "@/contexts/HouseholdContext";
import { Receipt as ReceiptType } from "@/types/budget";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { formatNOK } from "@/lib/format";
import { Label } from "@/components/ui/label";
import { ReceiptItemEditor } from "@/components/ReceiptItemEditor";

export function ReceiptList() {
  const { data: receipts, isLoading } = useMonthlyReceipts();
  const { data: categories } = useCategories();
  const { members } = useHousehold();
  const deleteReceipt = useDeleteReceipt();
  const updateReceiptPayer = useUpdateReceiptPayer();
  const updateReceipt = useUpdateReceipt();
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptType | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editStoreName, setEditStoreName] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTotal, setEditTotal] = useState("");
  const [editLabel, setEditLabel] = useState("");

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

  const handlePayerChange = async (receiptId: string, paidByUser: string) => {
    await updateReceiptPayer.mutateAsync({ receiptId, paidByUser });
  };

  const startEdit = (receipt: ReceiptType) => {
    setEditStoreName(receipt.store_name || "");
    setEditDate(receipt.receipt_date?.split("T")[0] || "");
    setEditTotal(String(Number(receipt.total_amount)));
    setEditLabel((receipt as unknown as { label?: string }).label || "");
    setEditMode(true);
  };

  const saveEdit = async () => {
    if (!currentReceipt) return;
    const total = parseFloat(editTotal.replace(",", "."));
    await updateReceipt.mutateAsync({
      receiptId: currentReceipt.id,
      updates: {
        store_name: editStoreName || undefined,
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
        <CardHeader className="flex flex-row items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6 pb-4">
          <CardTitle className="text-base sm:text-lg font-display">Kvitteringer</CardTitle>
          <ScrollText className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          {!receipts || receipts.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <Receipt className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground mt-2">
                Ingen kvitteringer denne måneden
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {receipts.map((receipt) => (
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
                        {(receipt as unknown as { label?: string }).label && (
                          <Badge variant="secondary" className="text-xs h-5 gap-1 shrink-0">
                            <Tag className="h-2.5 w-2.5" />
                            {(receipt as unknown as { label?: string }).label}
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
                  <div className="flex items-center gap-2 mt-1">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <Input
                      value={editLabel}
                      onChange={e => setEditLabel(e.target.value)}
                      className="h-7 text-sm"
                      placeholder="Etikett (valgfri)"
                    />
                  </div>
                ) : (currentReceipt as unknown as { label?: string }).label ? (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <Tag className="h-3 w-3" />
                    <span>{(currentReceipt as unknown as { label?: string }).label}</span>
                  </div>
                ) : null}
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
                <img
                  src={currentReceipt.image_url}
                  alt="Kvittering"
                  className="w-full rounded-lg max-h-48 object-cover"
                />
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
    </>
  );
}
