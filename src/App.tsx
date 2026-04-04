import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "@/contexts/AuthContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { CampaignProvider } from "@/contexts/CampaignContext";
import { MainLayout } from "@/components/layout/MainLayout";

// Páginas públicas
import Login from "./pages/Login";
import Register from "./pages/Register";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";

// Páginas da aplicação (lazy load)
const Dashboard   = lazy(() => import("./pages/Dashboard"));
const Voters      = lazy(() => import("./pages/Voters"));
const Leaders     = lazy(() => import("./pages/Leaders"));
const Demands     = lazy(() => import("./pages/Demands"));
const Finances    = lazy(() => import("./pages/Finances"));
const Events      = lazy(() => import("./pages/Events"));
const Materials   = lazy(() => import("./pages/Materials"));
const Territory   = lazy(() => import("./pages/Territory"));
const Editorial   = lazy(() => import("./pages/Editorial"));
const Surveys     = lazy(() => import("./pages/Surveys"));
const Opponents   = lazy(() => import("./pages/Opponents"));
const Documents   = lazy(() => import("./pages/Documents"));
const Reports     = lazy(() => import("./pages/Reports"));
const Settings    = lazy(() => import("./pages/Settings"));

const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner richColors closeButton />
      <BrowserRouter>
        <AuthProvider>
          <OrganizationProvider>
            <CampaignProvider>
              <Routes>
                {/* Rotas públicas — sem layout */}
                <Route path="/login"      element={<Login />} />
                <Route path="/register"   element={<Register />} />
                <Route path="/onboarding" element={<Onboarding />} />

                {/* Rotas protegidas — com sidebar/layout */}
                <Route
                  path="/*"
                  element={
                    <MainLayout>
                      <Suspense fallback={<PageLoader />}>
                        <Routes>
                          <Route index element={<Navigate to="/dashboard" replace />} />
                          <Route path="dashboard"    element={<Dashboard />} />
                          <Route path="eleitores"    element={<Voters />} />
                          <Route path="liderancas"   element={<Leaders />} />
                          <Route path="demandas"     element={<Demands />} />
                          <Route path="financeiro"   element={<Finances />} />
                          <Route path="agenda"       element={<Events />} />
                          <Route path="materiais"    element={<Materials />} />
                          <Route path="territorio"   element={<Territory />} />
                          <Route path="editorial"    element={<Editorial />} />
                          <Route path="pesquisas"    element={<Surveys />} />
                          <Route path="adversarios"  element={<Opponents />} />
                          <Route path="documentos"   element={<Documents />} />
                          <Route path="relatorios"   element={<Reports />} />
                          <Route path="configuracoes" element={<Settings />} />
                          <Route path="*"            element={<NotFound />} />
                        </Routes>
                      </Suspense>
                    </MainLayout>
                  }
                />
              </Routes>
            </CampaignProvider>
          </OrganizationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
