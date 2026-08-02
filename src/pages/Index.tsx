import { useState } from "react";
import { SpendingOverview } from "@/components/SpendingOverview";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { ReceiptList } from "@/components/ReceiptList";
import { ShoppingList } from "@/components/ShoppingList";
import { SpendingTrend } from "@/components/SpendingTrend";
import { SettlementOversikt } from "@/components/SettlementOversikt";
import { AppLayout, useReceiptUpload } from "@/components/AppLayout";
import { Camera, Pencil, ChevronDown, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

const Index = () => {
  const [showTrend, setShowTrend] = useState(false);
  const { openUpload } = useReceiptUpload();

  return (
    <>
      {/* KPI strip — spending overview */}
      <section>
        <SpendingOverview />
      </section>

      {/* Add receipt CTA */}
      <section>
        <div className="flex gap-2">
          <button
            onClick={() => openUpload(false)}
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
            onClick={() => openUpload(true)}
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
        <div className="lg:col-span-2">
          <ReceiptList />
        </div>
        <div className="space-y-4">
          <ShoppingList />
          <CategoryBreakdown />
        </div>
      </div>
    </>
  );
};

/** Wrapped so the route element stays a single component. */
const IndexPage = () => (
  <AppLayout title="Oversikt">
    <Index />
  </AppLayout>
);

export default IndexPage;
