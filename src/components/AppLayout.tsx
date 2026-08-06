import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Camera, Pencil, Search, Menu } from "lucide-react";
import { Loader2 } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { MonthSelector } from "@/components/MonthSelector";
import { UserMenu } from "@/components/UserMenu";
import { ExportData } from "@/components/ExportData";
import { BudgetSettings } from "@/components/BudgetSettings";
import { CategoryReviewButton } from "@/components/CategoryReview";
import { ConsentModal } from "@/components/ConsentModal";
import { ReceiptUpload } from "@/components/ReceiptUpload";
import { NoHousehold } from "@/components/NoHousehold";
import { useHousehold } from "@/contexts/HouseholdContext";
import { useMonth } from "@/contexts/MonthContext";

/**
 * Lets any page open the receipt-upload sheet without owning it. The sheet
 * lives here so it isn't duplicated per route, but the trigger belongs to
 * whichever page shows a CTA.
 */
const UploadContext = createContext<{ openUpload: (manual?: boolean) => void }>({
  openUpload: () => {},
});

export const useReceiptUpload = () => useContext(UploadContext);

const MONTHS = [
  "januar", "februar", "mars", "april", "mai", "juni",
  "juli", "august", "september", "oktober", "november", "desember",
];

interface AppLayoutProps {
  /** Shown as the desktop page heading. */
  title: string;
  children: ReactNode;
}

/**
 * Shared chrome for every authenticated route: sidebar (fixed on desktop,
 * drawer on mobile), header, upload sheet and consent modal.
 *
 * Extracted from Index so the sidebar routes can render their own content
 * instead of all five pointing at the same dashboard.
 */
export function AppLayout({ title, children }: AppLayoutProps) {
  const { household, loading } = useHousehold();
  const { selectedMonth, selectedYear } = useMonth();
  const [navOpen, setNavOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const monthLabel = `${MONTHS[selectedMonth - 1]} ${selectedYear}`.toUpperCase();

  // The ⌘K hint was printed next to the input without anything listening for
  // it. Now it does what it says.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  /**
   * Hands the term to ReceiptList via the URL rather than a second piece of
   * search state. ReceiptList already owns a working filter and its own input;
   * duplicating that here would have given the same query two sources of truth.
   */
  const submitSearch = () => {
    const q = query.trim();
    if (!q) return;
    navigate(`/kvitteringer?q=${encodeURIComponent(q)}`);
    searchRef.current?.blur();
  };

  const openUpload = (manual = false) => {
    setManualMode(manual);
    setUploadOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  // Every query below is scoped by household_id, and ReceiptUpload dereferences
  // it outright. Rendering the shell against a null household produced an app
  // that looked functional right up until the upload threw.
  if (!household) {
    return <NoHousehold />;
  }

  return (
    <UploadContext.Provider value={{ openUpload }}>
      <div className="flex min-h-screen bg-background">
        {/* Sidebar — fixed on desktop, drawer on mobile */}
        <div className="hidden lg:block">
          <AppSidebar />
        </div>

        <main className="flex-1 min-w-0 flex flex-col">
          {/* Top bar */}
          <div className="flex items-center lg:items-end justify-between gap-2 sm:gap-4 px-4 sm:px-6 pt-4 lg:pt-5 pb-3 lg:pb-4 border-b border-border bg-card lg:bg-transparent lg:border-b-0">
            <div className="hidden lg:block">
              <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
                {household?.name || "Husholdning"} · {monthLabel}
              </p>
              <h1 className="text-[26px] font-semibold tracking-tight mt-1">{title}</h1>
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
              {/* Wordmark needs more room than 375px leaves once the month picker is in */}
              <span className="font-semibold text-sm truncate hidden sm:inline">BudgetBandz</span>
            </div>

            <div className="flex items-center gap-2 justify-end min-w-0">
              <div className="hidden md:flex items-center gap-2 bg-card border border-border rounded-[10px] px-2.5 py-1.5 text-muted-foreground min-w-[200px]">
                <Search className="w-3.5 h-3.5 flex-shrink-0" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitSearch()}
                  placeholder="Søk i kvitteringer…"
                  aria-label="Søk i kvitteringer"
                  className="border-none bg-transparent outline-none text-[13px] flex-1 text-foreground placeholder:text-muted-foreground"
                />
                <kbd className="text-[10.5px] bg-muted px-1 py-0.5 rounded text-muted-foreground">⌘K</kbd>
              </div>

              <MonthSelector />

              <div className="hidden sm:flex items-center gap-2">
                <CategoryReviewButton />
                <ExportData />
                <BudgetSettings />
              </div>

              <UserMenu />
            </div>
          </div>

          {/* Mobile page heading — the desktop one lives in the top bar */}
          <div className="lg:hidden px-4 sm:px-6 pt-4">
            <p className="text-[10.5px] font-semibold tracking-widest uppercase text-muted-foreground">
              {monthLabel}
            </p>
            <h1 className="text-xl font-semibold tracking-tight mt-0.5">{title}</h1>
          </div>

          <div className="flex-1 px-4 sm:px-6 py-4 sm:py-5 space-y-4">
            {children}

            {/* Mobile-only action row — these live in the top bar on desktop */}
            <div className="flex items-center gap-2 sm:hidden pt-1">
              <CategoryReviewButton />
              <ExportData />
              <BudgetSettings />
            </div>
          </div>
        </main>

        <ConsentModal />

        <Sheet
          open={uploadOpen}
          onOpenChange={(open) => {
            setUploadOpen(open);
            if (!open) setManualMode(false);
          }}
        >
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
    </UploadContext.Provider>
  );
}
