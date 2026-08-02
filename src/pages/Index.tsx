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
import { ConsentModal } from "@/components/ConsentModal";
import { AppSidebar } from "@/components/AppSidebar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Camera, Pencil, Search, ChevronDown, BarChart2, Plus, Menu } from "lucide-react";
import { useHousehold } from "@/contexts/HouseholdContext";
import { Loader2 } from "lucide-react";
import { useMonth } from "@/contexts/MonthContext";
import { cn } from "@/lib/utils";

const Index = () => {
  const { household, loading } = useHousehold();
  const { selectedMonth, selectedYear } = useMonth();
  const monthLabel = new Date(selectedYear, selectedMonth - 1).toLocaleString("nb-NO", { month: "long", year: "numeric" });
  const [showTrend, setShowTrend] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar — hidden on mobile */}
      <div className="hidden lg:block">
        <AppSidebar />
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col">

        {/* Top bar */}
        <div className="flex items-center lg:items-end justify-between gap-2 sm:gap-4 px-4 sm:px-6 pt-4 lg:pt-5 pb-3 lg:pb-4 border-b border-border bg-card lg:bg-transparent lg:border-b-0">
          {/* Left: kicker + title — hidden on mobile replaced by brand */}
          <div className="hidden lg:block">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
              {household?.name || "Husholdning"} · {monthLabel}
            </p>
            <h1 className="text-[26px] font-semibold tracking-tight mt-1">Oversikt</h1>
          </div>

          {/* Mobile: menu + brand */}
          <div className="flex items-center gap-2 lg:hidden min-w-0">
            <Sheet open={navOpen} onOpenChange={setNavOpen}>
              <SheetTrigger asChild>
                <button
                  aria-label="Åpne meny"
                  className="w-9 h-9 -ml-1 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors flex-shrink-0"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[264px]">
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigasjon</SheetTitle>
                </SheetHeader>
                <AppSidebar variant="drawer" onNavigate={() => setNavOpen(false)} />
              </SheetContent>
            </Sheet>
            <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              B
            </div>
            {/* Wordmark needs more room than 375px leaves once the month picker is in; the mark alone carries it */}
            <span className="font-semibold text-sm truncate hidden sm:inline">BudgetBandz</span>
          </div>

          {/* Right: search + actions */}
          <div className="flex items-center gap-2 justify-end min-w-0">
            {/* Search — desktop only */}
            <div className="hidden md:flex items-center gap-2 bg-card border border-border rounded-[10px] px-2.5 py-1.5 text-muted-foreground min-w-[200px]">
              <Search className="w-3.5 h-3.5 flex-shrink-0" />
              <input
                placeholder="Søk i kvitteringer…"
                className="border-none bg-transparent outline-none text-[13px] flex-1 text-foreground placeholder:text-muted-foreground"
              />
              <kbd className="text-[10.5px] bg-muted px-1 py-0.5 rounded text-muted-foreground">⌘K</kbd>
            </div>

            {/* Month picker */}
            <MonthSelector />

            {/* Desktop actions */}
            <div className="hidden sm:flex items-center gap-2">
              <CategoryReviewButton />
              <ExportData />
              <BudgetSettings />
            </div>

            <UserMenu />
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 px-4 sm:px-6 py-4 sm:py-5 space-y-4">

          {/* KPI strip — spending overview */}
          <section>
            <SpendingOverview />
          </section>

          {/* Add receipt CTA */}
          <section>
            <div className="flex gap-2">
              <button
                onClick={() => { setManualMode(false); setUploadOpen(true); }}
                className="flex-1 flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-brand/25 bg-brand/5 hover:bg-brand/10 hover:border-brand/40 active:scale-[0.99] transition-all group text-left"
              >
                <div className="p-2.5 rounded-xl bg-brand/10 group-hover:bg-brand/20 transition-colors flex-shrink-0">
                  <Camera className="h-5 w-5 text-brand" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Legg til kvittering</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Skann eller last opp bilde — vi fyller ut resten</p>
                </div>
                <div className="flex-1" />
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground rounded-lg text-[13px] font-medium">
                  Skann
                </span>
              </button>
              <button
                onClick={() => { setManualMode(true); setUploadOpen(true); }}
                className="flex flex-col items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-border bg-card hover:bg-accent active:scale-[0.99] transition-all text-muted-foreground hover:text-foreground flex-shrink-0"
              >
                <Pencil className="h-4 w-4" />
                <span className="text-xs font-medium whitespace-nowrap">Manuelt</span>
              </button>
            </div>
          </section>

          {/* Settlement overview */}
          <section>
            <SettlementOversikt />
          </section>

          {/* Spending trend — collapsible */}
          <section>
            <button
              className="w-full flex items-center justify-between px-0 py-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowTrend(v => !v)}
            >
              <span className="flex items-center gap-1.5 font-medium">
                <BarChart2 className="h-3.5 w-3.5" />
                Forbrukstrend siste 6 måneder
              </span>
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", showTrend && "rotate-180")} />
            </button>
            {showTrend && (
              <div className="mt-3 bg-card border border-border rounded-xl p-4">
                <SpendingTrend />
              </div>
            )}
          </section>

          {/* Main content grid */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Receipts — span 2 */}
            <div className="lg:col-span-2">
              <ReceiptList />
            </div>

            {/* Right column: shopping + categories */}
            <div className="space-y-4">
              <ShoppingList />
              <CategoryBreakdown />
            </div>
          </div>

          {/* Mobile-only: extra actions row */}
          <div className="flex items-center gap-2 sm:hidden pt-1">
            <CategoryReviewButton />
            <ExportData />
            <BudgetSettings />
          </div>

        </div>
      </main>

      <ConsentModal />

      {/* Receipt upload sheet */}
      <Sheet open={uploadOpen} onOpenChange={(open) => { setUploadOpen(open); if (!open) setManualMode(false); }}>
        <SheetContent side="bottom" className="h-[92dvh] flex flex-col p-0 rounded-t-2xl sm:max-w-2xl sm:mx-auto">
          <SheetHeader className="px-4 pt-4 pb-2 border-b flex-shrink-0">
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
