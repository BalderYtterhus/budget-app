import { CategorySection } from "@/components/CategorySection";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";

/**
 * CategorySection is complete category CRUD that until now was only reachable
 * inside the Budsjett dialog. Surfacing it on its own route so managing
 * categories doesn't require opening budget settings first.
 */
const Categories = () => (
  <AppLayout title="Kategorier">
    <Card className="shadow-card">
      <CardContent className="px-4 sm:px-6 py-4 sm:py-6">
        <CategorySection />
      </CardContent>
    </Card>

    <CategoryBreakdown />
  </AppLayout>
);

export default Categories;
