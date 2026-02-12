import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";
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
import { OCRCSPremiumPage } from "./pages/OCRCSPremiumPage";
import { OCRPhysicsFreeVersionPage } from "./pages/OCRPhysicsFreeVersionPage";
import { OCRPhysicsPremiumPage } from "./pages/OCRPhysicsPremiumPage";
import { AQAChemistryFreeVersionPage } from "./pages/AQAChemistryFreeVersionPage";
import { AQAChemistryPremiumPage } from "./pages/AQAChemistryPremiumPage";
 import { AQAPsychologyFreeVersionPage } from "./pages/AQAPsychologyFreeVersionPage";
 import { AQAPsychologyPremiumPage } from "./pages/AQAPsychologyPremiumPage";
import { EdexcelMathsFreeVersionPage } from "./pages/EdexcelMathsFreeVersionPage";
import { EdexcelMathsPremiumPage } from "./pages/EdexcelMathsPremiumPage";
import { EdexcelMathsAppliedFreeVersionPage } from "./pages/EdexcelMathsAppliedFreeVersionPage";
import { EdexcelMathsAppliedPremiumPage } from "./pages/EdexcelMathsAppliedPremiumPage";
import { TestRAGChatPage } from "./pages/TestRAGChatPage";
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
    <ThemeProvider>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
          <ThemeToggle />
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
            <Route path="/ocr-physics-free-version" element={<OCRPhysicsFreeVersionPage />} />
            <Route path="/premium" element={<PremiumVersionPage />} />
            <Route path="/aqa-premium" element={<AQAPremiumPage />} />
            <Route path="/cie-premium" element={<CIEPremiumPage />} />
            <Route path="/ocr-cs-premium" element={<OCRCSPremiumPage />} />
            <Route path="/ocr-physics-premium" element={<OCRPhysicsPremiumPage />} />
            <Route path="/aqa-chemistry-free-version" element={<AQAChemistryFreeVersionPage />} />
            <Route path="/aqa-chemistry-premium" element={<AQAChemistryPremiumPage />} />
             <Route path="/aqa-psychology-free-version" element={<AQAPsychologyFreeVersionPage />} />
             <Route path="/aqa-psychology-premium" element={<AQAPsychologyPremiumPage />} />
            <Route path="/edexcel-maths-free-version" element={<EdexcelMathsFreeVersionPage />} />
            <Route path="/edexcel-maths-premium" element={<EdexcelMathsPremiumPage />} />
            <Route path="/edexcel-maths-applied-free-version" element={<EdexcelMathsAppliedFreeVersionPage />} />
            <Route path="/edexcel-maths-applied-premium" element={<EdexcelMathsAppliedPremiumPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/test-rag" element={<TestRAGChatPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
