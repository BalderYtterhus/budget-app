import { SpendingOverview } from "@/components/SpendingOverview";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { ReceiptUpload } from "@/components/ReceiptUpload";
import { ReceiptList } from "@/components/ReceiptList";
import { BudgetSettings } from "@/components/BudgetSettings";
import { ExportData } from "@/components/ExportData";
import { MonthSelector } from "@/components/MonthSelector";
import { UserMenu } from "@/components/UserMenu";
import { Settlement } from "@/components/Settlement";
import { ShoppingList } from "@/components/ShoppingList";
import { SpendingTrend } from "@/components/SpendingTrend";
import { CategoryReviewButton } from "@/components/CategoryReview";
import { ShoppingCart, Download } from "lucide-react";
import { useHousehold } from "@/contexts/HouseholdContext";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { SettlementSwitcher } from "@/components/SettlementSwitcher";
const Index = () => {
  const {
    household,
    loading
  } = useHousehold();
  const [showInstallLink, setShowInstallLink] = useState(false);
  useEffect(() => {
    // Only show install link if not already installed as standalone
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    setShowInstallLink(!isStandalone);
  }, []);
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }
  return <div className="min-h-screen bg-background">
      {/* Header - Sticky on mobile */}
      <header className="border-b bg-card/95 backdrop-blur-sm sticky top-0 z-20">
        <div className="container max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            {/* Logo - Smaller on mobile */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-display font-bold truncate">Budget App</h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate hidden sm:block">
                  <SettlementSwitcher />
                </p>
              </div>
            </div>
            
            {/* Actions - Optimized for mobile */}
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

      {/* Main Content - Single column on mobile, two columns on desktop */}
      <main className="container max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="space-y-4 sm:space-y-6">
          {/* Spending Overview Cards */}
          <section className="animate-fade-in">
            <SpendingOverview />
          </section>

          {/* Monthly trend chart */}
          <section className="animate-fade-in" style={{ animationDelay: "50ms" }}>
            <SpendingTrend />
          </section>

          {/* Mobile: Single column, Desktop: Two columns */}
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            {/* Left Column (or top on mobile) */}
            <div className="space-y-4 sm:space-y-6">
              <section className="animate-fade-in" style={{
              animationDelay: "100ms"
            }}>
                <ShoppingList />
              </section>
              <section className="animate-fade-in" style={{
              animationDelay: "150ms"
            }}>
                <ReceiptUpload />
              </section>
              <section className="animate-fade-in" style={{
              animationDelay: "200ms"
            }}>
                <CategoryBreakdown />
              </section>
              <section className="animate-fade-in" style={{
              animationDelay: "250ms"
            }}>
                <Settlement />
              </section>
            </div>

            {/* Right Column (or bottom on mobile) */}
            <section className="animate-fade-in" style={{
            animationDelay: "175ms"
          }}>
              <ReceiptList />
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-8 sm:mt-12">
        <div className="container max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
            <p className="text-xs text-muted-foreground text-center">
              Spor matforbruket ditt • Drevet av AI-kvitteringsscanning
            </p>
            <div className="flex items-center gap-3 sm:hidden">
              <ExportData />
            </div>
            {showInstallLink && <Link to="/install" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Download className="w-3 h-3" />
                Installer app
              </Link>}
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;