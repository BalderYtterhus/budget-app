import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Loader2, CheckCircle, X, Image, AlertCircle, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeForMatch, calculateSimilarity } from "@/lib/textMatch";
import { computeSystemConfidence, reconcileConfidence, type ConfidenceVerdict } from "@/lib/systemConfidence";
import { supabase } from "@/integrations/supabase/client";
import { ParsedReceipt } from "@/types/budget";
import { useSaveReceipt, useCategories, useItemMappings } from "@/hooks/useBudgetData";
import { useShoppingList, useRemoveMatchedItems } from "@/hooks/useShoppingList";
import { useHousehold } from "@/contexts/HouseholdContext";
import { useSettlementContext } from "@/contexts/SettlementContext";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatNOK } from "@/lib/format";

type UploadState = "idle" | "uploading" | "parsing" | "review" | "saving" | "success";

interface ReviewItem {
  rawText: string;
  normalizedName: string;
  price: number;
  quantity: number;
  unitPrice: number | null;
  categoryId: string | null;
  needsReview: boolean;
  confidence: number;
  // The AI's own category call, kept separate from categoryId so later edits
  // (mapping fallback, user correction) don't erase what the model predicted.
  aiPredictedCategoryId: string | null;
  // Set when the user changes the category in the review step — the main
  // source of human-verified labels, since most corrections happen pre-save.
  userReviewed: boolean;
  // Independent score from correction history; 0.5 means no evidence.
  systemConfidence: number;
  // How the model's confidence and the history score reconcile.
  verdict: ConfidenceVerdict;
  // Which learned pattern produced the score, for explaining the flag.
  historyPattern: string | null;
  historyCategoryId: string | null;
}

export function ReceiptUpload({ onSuccess, startManual }: { onSuccess?: () => void; startManual?: boolean } = {}) {
  const [state, setState] = useState<UploadState>("idle");
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedReceipt | null>(null);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [storeName, setStoreName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [receiptDate, setReceiptDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [paidByUser, setPaidByUser] = useState<string>("");
  const [storeChain, setStoreChain] = useState<string | null>(null);
  const [receiptLabel, setReceiptLabel] = useState("");

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const { data: categories } = useCategories();
  const { data: mappings } = useItemMappings();
  const { data: shoppingItems = [] } = useShoppingList();
  const { household, members } = useHousehold();
  const { activeSettlement } = useSettlementContext();
  const { user } = useAuth();
  const saveReceipt = useSaveReceipt();
  const removeMatchedItems = useRemoveMatchedItems();
  const { toast } = useToast();

  // Set default paid by to current user on mount
  useEffect(() => {
    if (user && !paidByUser) {
      setPaidByUser(user.id);
    }
  }, [user]);

  // Jump directly to manual entry when startManual is set
  useEffect(() => {
    if (startManual && state === "idle") {
      setState("review");
      if (user) setPaidByUser(user.id);
    }
  }, [startManual]);

  // Client-side fallback categorization using learned mappings (fuzzy match,
  // since receipt OCR text rarely matches a learned pattern exactly).
  const FUZZY_MATCH_THRESHOLD = 0.6;

  const findCategoryForItem = useCallback(
    (itemText: string): { categoryId: string | null; needsReview: boolean } => {
      if (!mappings || !categories || categories.length === 0) {
        return { categoryId: null, needsReview: true };
      }

      const normText = normalizeForMatch(itemText);

      // mappings is already ordered by frequency desc, so among equal-scoring
      // matches the more frequently confirmed one wins.
      let best: { categoryId: string; score: number } | null = null;
      for (const m of mappings) {
        const normPattern = normalizeForMatch(m.item_pattern);
        let score: number;
        if (normText === normPattern) score = 1;
        else if (normText.includes(normPattern) || normPattern.includes(normText)) score = 0.9;
        else score = calculateSimilarity(normText, normPattern);

        if (score >= FUZZY_MATCH_THRESHOLD && (!best || score > best.score)) {
          best = { categoryId: m.category_id, score };
        }
      }

      if (best) {
        return { categoryId: best.categoryId, needsReview: false };
      }

      // No match found - needs review
      return { categoryId: null, needsReview: true };
    },
    [mappings, categories]
  );

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 1600;
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) { height = Math.round(height * maxSize / width); width = maxSize; }
          else { width = Math.round(width * maxSize / height); height = maxSize; }
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          resolve(new File([blob!], file.name, { type: "image/jpeg" }));
        }, "image/jpeg", 0.85);
      };
      img.src = url;
    });
  };

  const processImage = async (originalFile: File) => {
    setState("uploading");
    const file = await compressImage(originalFile);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(file);

      // Upload to private bucket under household folder with unguessable UUID name
      const storagePath = `${household!.id}/${crypto.randomUUID()}`;
      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(storagePath, file);

      if (uploadError) throw uploadError;

      // Generate a 1-year signed URL (bucket is private — no public URL)
      const { data: signedData, error: signedError } = await supabase.storage
        .from("receipts")
        .createSignedUrl(storagePath, 60 * 60 * 24 * 365);

      if (signedError) throw signedError;
      setImageUrl(signedData.signedUrl);

      // Convert to base64 for OCR
      setState("parsing");
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.readAsDataURL(file);
      });

      // Call OCR edge function with household context
      const { data: ocrData, error: ocrError } = await supabase.functions.invoke(
        "parse-receipt",
        {
          body: { 
            imageBase64: base64, 
            mimeType: file.type,
            householdId: household?.id,
          },
        }
      );

      if (ocrError) throw ocrError;

      // OCR returned, but the model's output may still be unusable or
      // internally inconsistent. Warn rather than fail — manual entry from here
      // is still better than making the user start over.
      if (ocrData.parseError) {
        toast({
          title: "Kunne ikke lese kvitteringen automatisk",
          description: "Fyll inn detaljene manuelt nedenfor.",
          variant: "destructive",
        });
      } else if (ocrData.totalMismatch) {
        toast({
          title: "Sjekk totalbeløpet",
          description: `Varene summerer til ${formatNOK(ocrData.totalMismatch.itemSum)}, men totalen på kvitteringen er ${formatNOK(ocrData.totalMismatch.stated)}. Noen varer kan mangle.`,
        });
      }

      setParsedData(ocrData);
      setStoreName(ocrData.storeName || "");
      setStoreChain(ocrData.storeChain || null);
      setTotalAmount(ocrData.totalAmount?.toString() || "");
      if (ocrData.date) {
        setReceiptDate(ocrData.date);
      }

      // Set default payer to current user
      if (user) {
        setPaidByUser(user.id);
      }

      // Use AI-categorized items, with client-side fallback for uncategorized
      const itemsWithCategories = (ocrData.items || []).map(
        (item: { rawText: string; normalizedName?: string; price: number; quantity?: number; unitPrice?: number | null; categoryId?: string | null; needsReview?: boolean; confidence?: number }) => {
          const quantity = item.quantity || 1;
          const unitPrice = item.unitPrice ?? null;
          const confidence = item.confidence ?? 0;
          const normalizedName = item.normalizedName || item.rawText;

          // If AI provided category, use it
          if (item.categoryId) {
            // Score the same assignment from correction history, then let the
            // two signals decide reviewability together. This can flag an item
            // the AI was confident about, which its own score never would.
            const system = computeSystemConfidence(item.rawText, item.categoryId, mappings);
            const { verdict, needsReview } = reconcileConfidence(confidence, system);

            return {
              rawText: item.rawText,
              normalizedName,
              price: item.price,
              quantity,
              unitPrice,
              categoryId: item.categoryId,
              needsReview: item.needsReview || needsReview,
              confidence,
              aiPredictedCategoryId: item.categoryId,
              userReviewed: false,
              systemConfidence: system.score,
              verdict,
              historyPattern: system.matchedPattern,
              historyCategoryId: system.historyCategoryId,
            };
          }
          // Otherwise, try client-side categorization
          const fallback = findCategoryForItem(item.rawText);
          // The fallback derives from the same mappings, so a cross-check here
          // would just be the signal agreeing with itself. Record the evidence
          // for eval, but leave reviewability to the fallback's own judgement.
          const system = computeSystemConfidence(item.rawText, fallback.categoryId, mappings);
          return {
            rawText: item.rawText,
            normalizedName,
            price: item.price,
            quantity,
            unitPrice,
            categoryId: fallback.categoryId,
            needsReview: fallback.needsReview,
            confidence,
            // AI abstained — recorded as null so eval can separate
            // "model got it wrong" from "model declined to guess".
            aiPredictedCategoryId: null,
            userReviewed: false,
            systemConfidence: system.score,
            verdict: "no_signal" as const,
            historyPattern: system.matchedPattern,
            historyCategoryId: system.historyCategoryId,
          };
        }
      );
      setReviewItems(itemsWithCategories);

      setState("review");
    } catch (error) {
      console.error("Error processing receipt:", error);
      toast({
        title: "Feil ved behandling av kvittering",
        description: "Vennligst prøv igjen eller skriv inn detaljer manuelt.",
        variant: "destructive",
      });
      setState("idle");
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      processImage(file);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleGalleryClick = () => {
    galleryInputRef.current?.click();
  };

  const updateItemCategory = (index: number, categoryId: string) => {
    setReviewItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, categoryId, needsReview: false, userReviewed: true, verdict: "no_signal" as ConfidenceVerdict, historyPattern: null }
          : item
      )
    );
  };

  const updateItemField = (
    index: number,
    field: "rawText" | "quantity" | "price",
    value: string | number
  ) => {
    setReviewItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const next = { ...item, [field]: value } as ReviewItem;
        if (field === "quantity" || field === "price") {
          const q = Number(next.quantity) || 0;
          const p = Number(next.price) || 0;
          next.unitPrice = q > 0 ? p / q : null;
        }
        return next;
      })
    );
  };

  const addManualItem = () => {
    setReviewItems((prev) => [
      ...prev,
      { rawText: "", normalizedName: "", price: 0, quantity: 1, unitPrice: null, categoryId: null, needsReview: true, confidence: 0, aiPredictedCategoryId: null, userReviewed: true, systemConfidence: 0.5, verdict: "no_signal", historyPattern: null, historyCategoryId: null },
    ]);
  };

  const removeItem = (index: number) => {
    setReviewItems((prev) => prev.filter((_, i) => i !== index));
  };

  const startManualEntry = () => {
    setParsedData(null);
    setPreviewUrl(null);
    setImageUrl(null);
    setReviewItems([]);
    setStoreName("");
    setStoreChain(null);
    setTotalAmount("");
    setReceiptDate(new Date().toISOString().split("T")[0]);
    setReceiptLabel("");
    if (user) setPaidByUser(user.id);
    setState("review");
  };

  const handleSave = async () => {
    setState("saving");
    try {
      const itemsToSave = reviewItems.map((item) => ({
        rawText: item.rawText,
        normalizedName: item.normalizedName || item.rawText.toLowerCase().trim(),
        price: item.price,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        categoryId: item.categoryId,
        needsReview: item.needsReview,
        confidence: item.confidence,
        aiPredictedCategoryId: item.aiPredictedCategoryId,
        userReviewed: item.userReviewed,
        systemConfidence: item.systemConfidence,
      }));

      await saveReceipt.mutateAsync({
        storeName: storeName || null,
        storeChain,
        totalAmount: parseFloat(totalAmount) || 0,
        receiptDate,
        imageUrl,
        rawOcrText: parsedData?.rawText || null,
        paidByUser: paidByUser || null,
        settlementId: activeSettlement?.id || null,
        label: receiptLabel.trim() || null,
        items: itemsToSave,
      });

      // Auto-remove matched items from shopping list (only if we have items parsed)
      let removedItems: string[] = [];
      if (itemsToSave.length > 0 && shoppingItems.length > 0) {
        try {
          removedItems = await removeMatchedItems.mutateAsync({
            shoppingItems,
            receiptItems: itemsToSave,
          });
        } catch (err) {
          // Don't block receipt saving if shopping list removal fails
          console.error("Failed to remove shopping list items:", err);
        }
      }

      setState("success");
      onSuccess?.();

      // Build success message
      let description = `${formatNOK(parseFloat(totalAmount))} lagt til forbruket ditt.`;
      if (removedItems.length > 0) {
        description += ` Fjernet fra handlelisten: ${removedItems.join(", ")}`;
      }
      
      toast({
        title: "Kvittering lagret!",
        description,
      });

      // Reset after delay
      setTimeout(() => {
        setState("idle");
        setPreviewUrl(null);
        setParsedData(null);
        setReviewItems([]);
        setStoreName("");
        setTotalAmount("");
        setReceiptDate(new Date().toISOString().split("T")[0]);
        setImageUrl(null);
        setPaidByUser(user?.id || "");
        setReceiptLabel("");
      }, 2000);
    } catch (error) {
      console.error("Error saving receipt:", error);
      toast({
        title: "Feil ved lagring av kvittering",
        description: "Vennligst prøv igjen.",
        variant: "destructive",
      });
      setState("review");
    }
  };

  const reset = () => {
    setState("idle");
    setPreviewUrl(null);
    setParsedData(null);
    setReviewItems([]);
    setStoreName("");
    setTotalAmount("");
    setReceiptDate(new Date().toISOString().split("T")[0]);
    setImageUrl(null);
    setPaidByUser(user?.id || "");
    setReceiptLabel("");
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6 pb-4">
        <CardTitle className="text-base sm:text-lg font-display">Legg til kvittering</CardTitle>
        {state !== "idle" && state !== "success" && (
          <Button variant="ghost" size="icon" onClick={reset} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
        {/* Hidden file inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileInput}
          className="hidden"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />

        {/* Upload Zone - Larger tap target on mobile */}
        {state === "idle" && (
          <div
            className={cn(
              "relative border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-colors",
              dragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 active:border-primary active:bg-primary/5"
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 sm:p-4 rounded-full bg-primary/10">
                <Camera className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm sm:text-base">Last opp kvittering</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Ta bilde eller velg fra galleriet
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-2 w-full sm:w-auto">
                <Button 
                  variant="secondary" 
                  size="default" 
                  className="gap-2 min-h-[44px] text-sm"
                  onClick={handleCameraClick}
                >
                  <Camera className="h-4 w-4" />
                  Ta bilde
                </Button>
                <Button 
                  variant="outline" 
                  size="default" 
                  className="gap-2 min-h-[44px] text-sm"
                  onClick={handleGalleryClick}
                >
                  <Image className="h-4 w-4" />
                  Velg bilde
                </Button>
              </div>
              <button
                type="button"
                onClick={startManualEntry}
                className="text-xs sm:text-sm text-primary underline-offset-4 hover:underline mt-2"
              >
                Eller skriv inn manuelt uten bilde
              </button>
            </div>
          </div>
        )}

        {/* Loading States */}
        {(state === "uploading" || state === "parsing") && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">
              {state === "uploading" ? "Laster opp bilde..." : "Leser kvittering..."}
            </p>
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Forhåndsvisning"
                className="max-h-32 rounded-lg opacity-50"
              />
            )}
          </div>
        )}

        {/* Review State */}
        {state === "review" && (
          <div className="space-y-4">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Forhåndsvisning"
                className="max-h-32 sm:max-h-40 rounded-lg mx-auto"
              />
            )}

            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="store" className="text-sm">Butikknavn</Label>
                <Input
                  id="store"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="f.eks. Kiwi, Rema"
                  className="min-h-[44px] text-base sm:text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm">Dato</Label>
                <Input
                  id="date"
                  type="date"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  className="min-h-[44px] text-base sm:text-sm"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="total" className="text-sm">Totalbeløp *</Label>
                <div className="relative">
                  <Input
                    id="total"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="0,00"
                    required
                    className="min-h-[44px] text-base sm:text-sm pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    kr
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paidBy" className="text-sm">Betalt av *</Label>
                <Select value={paidByUser} onValueChange={setPaidByUser}>
                  <SelectTrigger className="min-h-[44px] text-base sm:text-sm">
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

            <div className="space-y-2">
              <Label htmlFor="label" className="text-sm">Etikett <span className="text-muted-foreground font-normal">(valgfri)</span></Label>
              <Input
                id="label"
                value={receiptLabel}
                onChange={(e) => setReceiptLabel(e.target.value)}
                placeholder="f.eks. hyttetur, fest, dagligvarer"
                className="min-h-[44px] text-base sm:text-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Varer ({reviewItems.length})</Label>
                {reviewItems.some(i => i.needsReview) && (
                  <span className="text-xs text-warning flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {reviewItems.filter(i => i.needsReview).length} trenger gjennomgang
                  </span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto space-y-3 rounded-lg border p-3">
                {reviewItems.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Ingen varer enda. Trykk "Legg til vare" for å begynne.
                  </p>
                )}
                {reviewItems.map((item, index) => (
                  <div
                    key={index}
                    className={cn(
                      "space-y-2 pb-3 border-b last:border-0 last:pb-0",
                      item.needsReview && "bg-warning/5 -mx-2 px-2 py-2 rounded"
                    )}
                  >
                    <div className="flex gap-2 items-center">
                      <Input
                        value={item.rawText}
                        onChange={(e) => updateItemField(index, "rawText", e.target.value)}
                        placeholder="Varenavn"
                        className="flex-1 h-9 text-sm"
                      />
                      {item.confidence > 0 && (
                        <span className={cn(
                          "shrink-0 text-xs px-1.5 py-0.5 rounded font-mono tabular-nums",
                          item.confidence >= 0.85
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : item.confidence >= 0.6
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        )}>
                          {Math.round(item.confidence * 100)}%
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        className="h-9 w-9 shrink-0"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                    {item.verdict === "ai_overconfident" && item.historyPattern && (
                      <p className="text-xs text-warning flex items-start gap-1.5">
                        <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                        <span>
                          Du har tidligere kategorisert «{item.historyPattern}» annerledes.
                          Sjekk at kategorien stemmer.
                        </span>
                      </p>
                    )}
                    <div className="grid grid-cols-[70px_1fr_1fr] gap-2">
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItemField(index, "quantity", parseInt(e.target.value) || 1)}
                        placeholder="Antall"
                        className="h-9 text-sm"
                      />
                      <div className="relative">
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          value={item.price || ""}
                          onChange={(e) => updateItemField(index, "price", parseFloat(e.target.value) || 0)}
                          placeholder="Pris"
                          className="h-9 text-sm pr-8"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">kr</span>
                      </div>
                      <Select
                        value={item.categoryId || "uncategorized"}
                        onValueChange={(v) =>
                          updateItemCategory(index, v === "uncategorized" ? "" : v)
                        }
                      >
                        <SelectTrigger className={cn(
                          "h-9 text-sm",
                          item.needsReview && !item.categoryId && "border-warning"
                        )}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="uncategorized">Ukategorisert</SelectItem>
                          {categories?.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={addManualItem}
                className="w-full gap-2"
              >
                <Plus className="h-4 w-4" />
                Legg til vare
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                onClick={handleSave}
                disabled={!totalAmount || parseFloat(totalAmount) <= 0 || !paidByUser}
                className="flex-1 min-h-[44px]"
              >
                Lagre kvittering
              </Button>
              <Button variant="outline" onClick={reset} className="min-h-[44px]">
                Avbryt
              </Button>
            </div>
          </div>
        )}

        {/* Saving State */}
        {state === "saving" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Lagrer kvittering...</p>
          </div>
        )}

        {/* Success State */}
        {state === "success" && (
          <div className="flex flex-col items-center gap-4 py-8 animate-fade-in">
            <div className="p-3 rounded-full bg-success/10">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <p className="font-medium">Kvittering lagret!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
