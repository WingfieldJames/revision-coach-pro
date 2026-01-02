import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAffiliateTracking } from "./hooks/useAffiliateTracking";
import { HomePage } from "./pages/HomePage";
import { ComparePage } from "./pages/ComparePage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { ContactPage } from "./pages/ContactPage";
import { FreeVersionPage } from "./pages/FreeVersionPage";
import { AQAFreeVersionPage } from "./pages/AQAFreeVersionPage";
import { PremiumVersionPage } from "./pages/PremiumVersionPage";
import { AQAPremiumPage } from "./pages/AQAPremiumPage";
import { CIEFreeVersionPage } from "./pages/CIEFreeVersionPage";
import { CIEPremiumPage } from "./pages/CIEPremiumPage";
import { OCRCSFreeVersionPage } from "./pages/OCRCSFreeVersionPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  useAffiliateTracking();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/free-version" element={<FreeVersionPage />} />
            <Route path="/aqa-free-version" element={<AQAFreeVersionPage />} />
            <Route path="/cie-free-version" element={<CIEFreeVersionPage />} />
            <Route path="/ocr-cs-free-version" element={<OCRCSFreeVersionPage />} />
            <Route path="/premium" element={<PremiumVersionPage />} />
            <Route path="/aqa-premium" element={<AQAPremiumPage />} />
            <Route path="/cie-premium" element={<CIEPremiumPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
