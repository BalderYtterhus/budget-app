import { Link, useLocation } from "react-router-dom";
import { LayoutGrid, Receipt, Users, Tag, TrendingUp, Settings, LogOut, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHousehold } from "@/contexts/HouseholdContext";
import { useMonthlyReceipts, useSplitRatios } from "@/hooks/useBudgetData";
import { useSettlementContext } from "@/contexts/SettlementContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatNOK } from "@/lib/format";

const navItems = [
  { href: "/",              icon: LayoutGrid, label: "Oversikt" },
  { href: "/kvitteringer",  icon: Receipt,    label: "Kvitteringer" },
  { href: "/oppgjor",       icon: Users,      label: "Oppgjør",     accent: true },
  { href: "/kategorier",    icon: Tag,        label: "Kategorier" },
  { href: "/rapporter",     icon: TrendingUp, label: "Rapporter" },
];

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const MEMBER_COLORS = [
  "hsl(240 40% 55%)",
  "hsl(160 45% 45%)",
  "hsl(30 65% 55%)",
  "hsl(280 35% 55%)",
  "hsl(200 45% 50%)",
];

export function AppSidebar() {
  const location = useLocation();
  const { household, members } = useHousehold();
  const { user } = useAuth();
  const { activeSettlement } = useSettlementContext();
  const { data: receipts } = useMonthlyReceipts();
  const { data: splitRatios } = useSplitRatios();

  const paidByUser = receipts?.reduce((acc, receipt) => {
    if (receipt.paid_by_user) {
      const items = receipt.items ?? [];
      const total = items.length > 0
        ? items.filter(i => i.included_in_totals !== false).reduce((s, i) => s + Number(i.price), 0)
        : Number(receipt.total_amount);
      acc[receipt.paid_by_user] = (acc[receipt.paid_by_user] || 0) + total;
    }
    return acc;
  }, {} as Record<string, number>) || {};

  const totalSpent = Object.values(paidByUser).reduce((s, a) => s + a, 0);

  const getRatio = (userId: string) => {
    const ratio = splitRatios?.find(r => r.user_id === userId);
    if (ratio) return Number(ratio.ratio);
    return members.length > 0 ? 100 / members.length : 50;
  };

  const getMemberName = (m: typeof members[0]) =>
    m.profile?.display_name || m.profile?.email?.split("@")[0] || "Ukjent";

  const currentPath = location.pathname;

  return (
    <aside className="w-sidebar flex-shrink-0 bg-card border-r border-border flex flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-5">
        <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
          B
        </div>
        <span className="font-semibold text-sm tracking-tight">BudgetBandz</span>
      </div>

      {/* Household + members */}
      <div className="px-3 mb-2">
        <p className="text-[10.5px] font-semibold tracking-widest text-muted-foreground px-1.5 pb-1.5 uppercase">
          Oppgjør
        </p>
        <button className="w-full flex items-center gap-2.5 bg-secondary border border-border rounded-lg px-2.5 py-2 text-[13px] font-medium text-left">
          <span className="w-2 h-2 rounded-full bg-[hsl(160_60%_45%)] flex-shrink-0" />
          <span className="flex-1 truncate">{household?.name || "Husholdning"}</span>
          <span className="text-muted-foreground text-[11px]">▾</span>
        </button>

        {/* Member rows */}
        {members.length > 0 && (
          <div className="mt-1.5 flex flex-col gap-0.5">
            {members.map((m, idx) => {
              const paid = paidByUser[m.user_id] || 0;
              const shouldPay = totalSpent * (getRatio(m.user_id) / 100);
              const delta = paid - shouldPay;
              const color = MEMBER_COLORS[idx % MEMBER_COLORS.length];
              const name = getMemberName(m);
              const isMe = m.user_id === user?.id;

              return (
                <div key={m.user_id} className="flex items-center gap-2 px-1.5 py-1 rounded-lg">
                  <div
                    className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-white text-[9.5px] font-semibold flex-shrink-0"
                    style={{ background: color }}
                  >
                    {getInitials(name)}
                  </div>
                  <span className="flex-1 text-[12.5px] truncate">
                    {name.split(" ")[0]}{isMe && <span className="text-muted-foreground"> (du)</span>}
                  </span>
                  {totalSpent > 0 && (
                    <span
                      className="text-[11.5px] font-semibold tabular-nums"
                      style={{ color: delta >= 0 ? "hsl(145 55% 38%)" : "hsl(0 65% 50%)" }}
                    >
                      {delta >= 0 ? "+" : "−"}{formatNOK(Math.abs(delta)).replace(" kr", "")}
                    </span>
                  )}
                </div>
              );
            })}
            <button className="flex items-center gap-1.5 px-1.5 py-1.5 text-[11.5px] font-medium text-brand hover:text-brand/80 transition-colors mt-0.5">
              <Plus className="w-3 h-3" />
              Inviter medlem
            </button>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 px-2 flex-1">
        {navItems.map(({ href, icon: Icon, label, accent }) => {
          const isActive = href === "/" ? currentPath === "/" : currentPath.startsWith(href);
          return (
            <Link
              key={href}
              to={href}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors",
                isActive
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <Icon className="w-[15px] h-[15px] flex-shrink-0" strokeWidth={1.7} />
              <span className="flex-1">{label}</span>
              {accent && activeSettlement && (
                <span className="text-[10.5px] font-semibold bg-brand text-white px-1.5 py-0.5 rounded-full">
                  •
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Profile footer */}
      <div className="px-3 pb-4 mt-2">
        <button
          className="w-full flex items-center gap-2.5 px-1.5 py-1.5 rounded-lg hover:bg-accent/50 transition-colors"
          onClick={() => supabase.auth.signOut()}
        >
          <div className="w-[30px] h-[30px] rounded-full bg-[hsl(160_45%_45%)] flex items-center justify-center text-white text-[10.5px] font-semibold flex-shrink-0">
            {getInitials(members.find(m => m.user_id === user?.id)?.profile?.display_name ||
              members.find(m => m.user_id === user?.id)?.profile?.email || user?.email)}
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-[12.5px] font-medium truncate">
              {members.find(m => m.user_id === user?.id)?.profile?.display_name ||
               user?.email?.split("@")[0] || "Profil"}
            </p>
            <p className="text-[11px] text-muted-foreground">Innstillinger</p>
          </div>
        </button>
      </div>
    </aside>
  );
}
