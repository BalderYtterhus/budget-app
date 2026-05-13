import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatNOK } from "@/lib/format";
import { Database, Store, Package, TrendingUp, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface StatRow {
  store_chain: string;
  normalized_name: string;
  category_name: string | null;
  price: number;
  unit_price: number | null;
  receipt_date: string;
}

function useOverviewStats() {
  return useQuery({
    queryKey: ["price-db-overview"],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from("public_price_data")
        .select("store_chain, normalized_name, category_name", { count: "exact" });
      if (error) throw error;
      const rows = data || [];
      const chains = new Set(rows.map(r => r.store_chain)).size;
      const products = new Set(rows.map(r => r.normalized_name)).size;
      return { total: count ?? 0, chains, products };
    },
    staleTime: 60_000,
  });
}

function useProductTrend(name: string) {
  return useQuery({
    queryKey: ["price-db-trend", name],
    queryFn: async () => {
      if (!name) return [];
      const { data, error } = await supabase
        .from("public_price_data")
        .select("store_chain, unit_price, price, quantity, receipt_date")
        .ilike("normalized_name", `%${name}%`)
        .order("receipt_date");
      if (error) throw error;

      // Group by month × store_chain, median unit price
      const grouped: Record<string, Record<string, number[]>> = {};
      for (const row of data || []) {
        const month = row.receipt_date.slice(0, 7);
        const up = row.unit_price ?? (Number(row.price) / (row.quantity || 1));
        if (!grouped[month]) grouped[month] = {};
        if (!grouped[month][row.store_chain]) grouped[month][row.store_chain] = [];
        grouped[month][row.store_chain].push(up);
      }

      const chains = [...new Set((data || []).map(r => r.store_chain))].sort();
      const months = Object.keys(grouped).sort();

      return months.map(month => ({
        month,
        ...Object.fromEntries(
          chains.map(chain => {
            const prices = grouped[month]?.[chain] ?? [];
            const sorted = [...prices].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            const median = sorted.length
              ? sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
              : null;
            return [chain, median !== null ? Math.round(median * 100) / 100 : null];
          })
        ),
        _chains: chains,
      }));
    },
    enabled: name.length >= 2,
    staleTime: 60_000,
  });
}

const CHAIN_COLORS = ["#60a5fa", "#4ade80", "#f87171", "#fb923c", "#a78bfa", "#34d399"];

export default function PrisDatabase() {
  const { data: stats } = useOverviewStats();
  const [search, setSearch] = useState("");
  const [committed, setCommitted] = useState("");
  const { data: trend = [] } = useProductTrend(committed);

  const chains: string[] = trend[0]?.["_chains"] ?? [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/95 backdrop-blur-sm sticky top-0 z-20">
        <div className="container max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link to="/"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <h1 className="font-display font-bold text-lg">Prisdatabase</h1>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Overview stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="shadow-card">
            <CardContent className="pt-4 pb-4 px-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">Datapunkter</span>
              </div>
              <p className="text-2xl font-bold font-display tabular-nums">
                {stats?.total.toLocaleString("nb-NO") ?? "–"}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-4 pb-4 px-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Store className="h-4 w-4" />
                <span className="text-xs">Butikkjeder</span>
              </div>
              <p className="text-2xl font-bold font-display tabular-nums">
                {stats?.chains ?? "–"}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-4 pb-4 px-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Package className="h-4 w-4" />
                <span className="text-xs">Unike produkter</span>
              </div>
              <p className="text-2xl font-bold font-display tabular-nums">
                {stats?.products ?? "–"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Product price trend search */}
        <Card className="shadow-card">
          <CardHeader className="px-4 sm:px-6 pt-4 pb-3">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Search className="h-4 w-4" />
              Pristrend per produkt
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Søk produkt (f.eks. helmelk, egg, smør)..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && setCommitted(search.trim())}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={() => setCommitted(search.trim())}
                disabled={search.trim().length < 2}
              >
                Søk
              </Button>
            </div>

            {committed && trend.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Ingen data for «{committed}» enda.
              </p>
            )}

            {trend.length > 0 && (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trend} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `${v},-`}
                  />
                  <Tooltip
                    formatter={(v: number) => formatNOK(v)}
                    labelFormatter={l => `Måned: ${l}`}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" iconSize={8} />
                  {chains.map((chain, i) => (
                    <Line
                      key={chain}
                      type="monotone"
                      dataKey={chain}
                      stroke={CHAIN_COLORS[i % CHAIN_COLORS.length]}
                      dot={false}
                      strokeWidth={2}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}

            {!committed && (
              <p className="text-xs text-muted-foreground text-center py-4">
                Søk på et produktnavn for å se prisutviklingen per butikkjede over tid.
              </p>
            )}
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
