import { useState } from "react";
import { SpendingOverview } from "@/components/SpendingOverview";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { ReceiptUpload } from "@/components/ReceiptUpload";
import { ReceiptList } from "@/components/ReceiptList";
import { BudgetSettings } from "@/components/BudgetSettings";
import { ExportData } from "@/components/ExportData";
import { MonthSelector } from "@/components/MonthSelector";
import { UserMenu } from "@/components/UserMenu";
import { ShoppingList } from "@/components/ShoppingList";
import { SpendingTrend } from "@/components/SpendingTrend";
import { CategoryReviewButton } from "@/components/CategoryReview";
import { SettlementOversikt } from "@/components/SettlementOversikt";
import { SettlementSwitcher } from "@/components/SettlementSwitcher";
import { ConsentModal } from "@/components/ConsentModal";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Download, Camera, ChevronDown, BarChart2, Pencil } from "lucide-react";
import { useHousehold } from "@/contexts/HouseholdContext";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

const Index = () => {
  const { household, loading } = useHousehold();
  const [showInstallLink, setShowInstallLink] = useState(false);
  const [showTrend, setShowTrend] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    setShowInstallLink(!isStandalone);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur-sm sticky top-0 z-20">
        <div className="container max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-display font-bold truncate">BudgetBandz</h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  <SettlementSwitcher />
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <MonthSelector />
              <CategoryReviewButton />
              <div className="hidden sm:flex items-center gap-1">
                <ExportData />
              </div>
              <BudgetSettings />
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="space-y-4 sm:space-y-5">

          {/* 1. Spending overview cards */}
          <section className="animate-fade-in">
            <SpendingOverview />
          </section>

          {/* 2. Add receipt — prominent CTA */}
          <section className="animate-fade-in" style={{ animationDelay: "50ms" }}>
            <div className="flex gap-2">
              <button
                onClick={() => { setManualMode(false); setUploadOpen(true); }}
                className="flex-1 flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-primary/25 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 active:scale-[0.99] transition-all group text-left"
              >
                <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors shrink-0">
                  <Camera className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm sm:text-base">Legg til kvittering</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Skann eller last opp bilde</p>
                </div>
              </button>
              <button
                onClick={() => { setManualMode(true); setUploadOpen(true); }}
                className="flex flex-col items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-border bg-card hover:bg-accent active:scale-[0.99] transition-all text-muted-foreground hover:text-foreground shrink-0"
              >
                <Pencil className="h-4 w-4" />
                <span className="text-xs font-medium whitespace-nowrap">Manuelt</span>
              </button>
            </div>
          </section>

          {/* 3. Settlement oversikt */}
          <section className="animate-fade-in" style={{ animationDelay: "100ms" }}>
            <SettlementOversikt />
          </section>

          {/* 4. Spending trend — toggle */}
          <section className="animate-fade-in" style={{ animationDelay: "125ms" }}>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between text-muted-foreground hover:text-foreground h-9"
              onClick={() => setShowTrend(v => !v)}
            >
              <span className="flex items-center gap-1.5">
                <BarChart2 className="h-4 w-4" />
                Forbrukstrend siste 6 måneder
              </span>
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", showTrend && "rotate-180")} />
            </Button>
            {showTrend && (
              <div className="mt-2">
                <SpendingTrend />
              </div>
            )}
          </section>

          {/* 5. Main grid: receipts + shopping + categories */}
          <div className="grid gap-4 sm:gap-5 lg:grid-cols-2 animate-fade-in" style={{ animationDelay: "150ms" }}>
            {/* Left: receipts */}
            <div className="space-y-4 sm:space-y-5">
              <ReceiptList />
            </div>

            {/* Right: shopping list + categories */}
            <div className="space-y-4 sm:space-y-5">
              <ShoppingList />
              <CategoryBreakdown />
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-8 sm:mt-12">
        <div className="container max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
            <p className="text-xs text-muted-foreground text-center">
              Spor matforbruket ditt · Drevet av AI-kvitteringsscanning
            </p>
            <div className="flex items-center gap-3 sm:hidden">
              <ExportData />
            </div>
            {showInstallLink && (
              <Link
                to="/install"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Download className="w-3 h-3" />
                Installer app
              </Link>
            )}
          </div>
        </div>
      </footer>

      <ConsentModal />

      {/* Receipt upload sheet */}
      <Sheet open={uploadOpen} onOpenChange={(open) => { setUploadOpen(open); if (!open) setManualMode(false); }}>
        <SheetContent side="bottom" className="h-[92dvh] flex flex-col p-0 rounded-t-2xl sm:max-w-2xl sm:mx-auto">
          <SheetHeader className="px-4 pt-4 pb-2 border-b shrink-0">
            <SheetTitle className="flex items-center gap-2">
              {manualMode ? <Pencil className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
              {manualMode ? "Skriv inn kvittering" : "Legg til kvittering"}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            <ReceiptUpload
              startManual={manualMode}
              onSuccess={() => setTimeout(() => setUploadOpen(false), 1500)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Index;
