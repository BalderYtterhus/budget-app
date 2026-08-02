import { SpendingOverview } from "@/components/SpendingOverview";
import { SpendingTrend } from "@/components/SpendingTrend";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Reports = () => (
  <AppLayout title="Rapporter">
    <section>
      <SpendingOverview />
    </section>

    {/* Expanded by default here — on the dashboard this is collapsed behind a toggle */}
    <Card className="shadow-card">
      <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
        <CardTitle className="text-base sm:text-lg font-display">Forbrukstrend</CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-4 pb-2">
        <SpendingTrend />
      </CardContent>
    </Card>

    <CategoryBreakdown />
  </AppLayout>
);

export default Reports;
