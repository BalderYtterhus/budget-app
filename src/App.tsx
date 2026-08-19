import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { HouseholdProvider } from "@/contexts/HouseholdContext";
import { MonthProvider } from "@/contexts/MonthContext";
import { SettlementProvider } from "@/contexts/SettlementContext";
import { RequireAuth } from "@/components/RequireAuth";
import { InstallPrompt } from "@/components/InstallPrompt";
import Index from "./pages/Index";
import Receipts from "./pages/Receipts";
import Oppgjor from "./pages/Oppgjor";
import Categories from "./pages/Categories";
import Reports from "./pages/Reports";
import Auth from "./pages/Auth";
import Install from "./pages/Install";
import JoinHousehold from "./pages/JoinHousehold";
import StoreComparison from "./pages/StoreComparison";
import PrisDatabase from "./pages/PrisDatabase";
import NotFound from "./pages/NotFound";

// Failed queries used to resolve to undefined and render as an ordinary empty
// state, which is how a PostgREST embed error and an RLS-hidden settlements
// table both went unnoticed for a full day — a broken receipt list is visually
// identical to a month with no receipts. Log every failure with its query key
// so the cause is visible in the console instead of silently swallowed.
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      console.error(
        `[query failed] ${JSON.stringify(query.queryKey)}`,
        error instanceof Error ? error.message : error,
      );
    },
  }),
});

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <MonthProvider>
            <InstallPrompt />
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/install" element={<Install />} />
              <Route path="/join" element={<JoinHousehold />} />
              {/* Each sidebar route now renders its own page. They previously all
                  pointed at <Index />, so the nav changed the URL and the active
                  highlight while the content stayed identical. */}
              {/* Every authenticated route gets the same providers. /prisdatabase
                  used to be the exception — it queries only public_price_data, so
                  it needed neither — but that left one route where any component
                  calling useHousehold() would throw instead of render. */}
              {([
                ["/", Index],
                ["/kvitteringer", Receipts],
                ["/oppgjor", Oppgjor],
                ["/kategorier", Categories],
                ["/rapporter", Reports],
                ["/store-comparison", StoreComparison],
                ["/prisdatabase", PrisDatabase],
              ] as const).map(([path, Page]) => (
                <Route
                  key={path}
                  path={path}
                  element={
                    <RequireAuth>
                      <HouseholdProvider>
                        <SettlementProvider>
                          <Page />
                        </SettlementProvider>
                      </HouseholdProvider>
                    </RequireAuth>
                  }
                />
              ))}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MonthProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
