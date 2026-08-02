import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHousehold } from "@/contexts/HouseholdContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Loader2, TrendingUp } from "lucide-react";
import { formatNOK } from "@/lib/format";
import { QueryErrorState } from "@/components/QueryErrorState";

const CATEGORY_COLORS: Record<string, string> = {
  "Meieri": "#60a5fa",
  "Frukt & Grønt": "#4ade80",
  "Kjøtt & Fisk": "#f87171",
  "Tørrvarer": "#fb923c",
  "Snacks & Søtsaker": "#a78bfa",
  "Annet": "#94a3b8",
};

function getCategoryColor(name: string, index: number): string {
  if (CATEGORY_COLORS[name]) return CATEGORY_COLORS[name];
  const fallbacks = ["#38bdf8", "#34d399", "#fbbf24", "#f472b6", "#818cf8", "#a3e635"];
  return fallbacks[index % fallbacks.length];
}

function norwegianMonth(isoMonth: string): string {
  const [, m] = isoMonth.split("-");
  const names = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];
  return names[parseInt(m, 10) - 1] ?? m;
}

function useMonthlyTrend(monthsBack = 6) {
  const { household } = useHousehold();

  return useQuery({
    queryKey: ["monthly-trend", household?.id, monthsBack],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - monthsBack + 1);
      startDate.setDate(1);

      const { data: receipts, error } = await supabase
        .from("receipts")
        .select(`
          receipt_date,
          total_amount,
          items:receipt_items (
            price,
            included_in_totals,
            category:categories!receipt_items_category_id_fkey ( name )
          )
        `)
        .eq("household_id", household!.id)
        .gte("receipt_date", startDate.toISOString().split("T")[0])
        .order("receipt_date");

      if (error) throw error;

      // Accumulate spending per month per category
      const monthly: Record<string, Record<string, number>> = {};
      const categoryNames = new Set<string>();

      for (const receipt of receipts || []) {
        const key = receipt.receipt_date.slice(0, 7); // "YYYY-MM"
        if (!monthly[key]) monthly[key] = {};

        const items = (receipt.items as any[]) || [];
        if (items.length === 0) {
          const cat = "Annet";
          monthly[key][cat] = (monthly[key][cat] || 0) + Number(receipt.total_amount);
          categoryNames.add(cat);
        } else {
          for (const item of items) {
            if (item.included_in_totals === false) continue;
            const cat = item.category?.name || "Annet";
            monthly[key][cat] = (monthly[key][cat] || 0) + Number(item.price);
            categoryNames.add(cat);
          }
        }
      }

      // Build ordered month list (even months with 0 spending)
      const months: string[] = [];
      const cursor = new Date(startDate);
      const now = new Date();
      while (cursor <= now) {
        months.push(cursor.toISOString().slice(0, 7));
        cursor.setMonth(cursor.getMonth() + 1);
      }

      const chartData = months.map(m => ({
        month: norwegianMonth(m),
        ...Object.fromEntries(
          [...categoryNames].map(cat => [cat, Math.round((monthly[m]?.[cat] || 0))])
        ),
      }));

      return { chartData, categories: [...categoryNames] };
    },
    enabled: !!household,
    staleTime: 60_000,
  });
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s: number, p: any) => s + (p.value || 0), 0);
  return (
    <div className="rounded-lg border bg-card shadow-md px-3 py-2 text-sm space-y-1">
      <p className="font-medium">{label}</p>
      {payload.map((p: any) => (
        p.value > 0 && (
          <div key={p.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.fill }} />
              {p.name}
            </span>
            <span className="font-mono">{formatNOK(p.value)}</span>
          </div>
        )
      ))}
      <div className="flex justify-between border-t pt-1 font-medium">
        <span>Totalt</span>
        <span className="font-mono">{formatNOK(total)}</span>
      </div>
    </div>
  );
};

export function SpendingTrend() {
  const { data, isLoading, isError, error, refetch } = useMonthlyTrend(6);

  return (
    <Card className="shadow-card">
      <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4">
        <CardTitle className="text-base sm:text-lg font-display flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Forbruk siste 6 måneder
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-4 pb-4 sm:pb-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <QueryErrorState what="forbrukstrenden" error={error} onRetry={() => refetch()} />
        ) : !data || data.chartData.every(row =>
          data.categories.every(cat => !(row as any)[cat])
        ) ? (
          <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
            Ingen kvitteringer enda — last opp den første!
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                iconType="circle"
                iconSize={8}
              />
              {data.categories.map((cat, i) => (
                <Bar
                  key={cat}
                  dataKey={cat}
                  stackId="spend"
                  fill={getCategoryColor(cat, i)}
                  radius={i === data.categories.length - 1 ? [3, 3, 0, 0] : undefined}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
