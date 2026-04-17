import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import PolicyDetails from "./pages/PolicyDetails";
import Analytics from "./pages/Analytics";
import PremiumCalc from "./pages/PremiumCalc";
import Claims from "./pages/Claims";
import ClaimDetail from "./pages/ClaimDetail";
import NotFound from "./pages/NotFound";

import RoleSelection from "./pages/RoleSelection";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPolicies from "./pages/admin/AdminPolicies";
import AdminWorkers from "./pages/admin/AdminWorkers";
import LossRatios from "./pages/admin/LossRatios";
import PredictiveAnalytics from "./pages/admin/PredictiveAnalytics";
import AdminClaims from "./pages/admin/AdminClaims";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RoleSelection />} />
          <Route path="/worker-login" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/policy" element={<PolicyDetails />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/calculator" element={<PremiumCalc />} />
          <Route path="/claims" element={<Claims />} />
          <Route path="/claims/:id" element={<ClaimDetail />} />
          
          <Route path="/role-select" element={<RoleSelection />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/policies" element={<AdminPolicies />} />
          <Route path="/admin/workers" element={<AdminWorkers />} />
          <Route path="/admin/loss-ratios" element={<LossRatios />} />
          <Route path="/admin/predictive" element={<PredictiveAnalytics />} />
          <Route path="/admin/claims" element={<AdminClaims />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
