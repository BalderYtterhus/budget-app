import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { HouseholdProvider } from "@/contexts/HouseholdContext";
import { MonthProvider } from "@/contexts/MonthContext";
import { SettlementProvider } from "@/contexts/SettlementContext";
import { RequireAuth } from "@/components/RequireAuth";
import { InstallPrompt } from "@/components/InstallPrompt";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Install from "./pages/Install";
import JoinHousehold from "./pages/JoinHousehold";
import StoreComparison from "./pages/StoreComparison";
import PrisDatabase from "./pages/PrisDatabase";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
              <Route
                path="/"
                element={
                  <RequireAuth>
                    <HouseholdProvider>
                      <SettlementProvider>
                        <Index />
                      </SettlementProvider>
                    </HouseholdProvider>
                  </RequireAuth>
                }
              />
              <Route
                path="/store-comparison"
                element={
                  <RequireAuth>
                    <HouseholdProvider>
                      <SettlementProvider>
                        <StoreComparison />
                      </SettlementProvider>
                    </HouseholdProvider>
                  </RequireAuth>
                }
              />
              <Route
                path="/prisdatabase"
                element={
                  <RequireAuth>
                    <PrisDatabase />
                  </RequireAuth>
                }
              />
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
