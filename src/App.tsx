import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { HouseholdProvider } from "@/contexts/HouseholdContext";
import { MonthProvider } from "@/contexts/MonthContext";
import { RequireAuth } from "@/components/RequireAuth";
import { InstallPrompt } from "@/components/InstallPrompt";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Install from "./pages/Install";
import JoinHousehold from "./pages/JoinHousehold";
import StoreComparison from "./pages/StoreComparison";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
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
                      <Index />
                    </HouseholdProvider>
                  </RequireAuth>
                }
              />
              <Route
                path="/store-comparison"
                element={
                  <RequireAuth>
                    <HouseholdProvider>
                      <StoreComparison />
                    </HouseholdProvider>
                  </RequireAuth>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MonthProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
