import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChatHistoryProvider } from "@/contexts/ChatHistoryContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

import { useAffiliateTracking } from "./hooks/useAffiliateTracking";
import { useReferralCapture } from "./hooks/useReferralCapture";

// Route-level code-splitting: page components load on demand so the marketing
// homepage no longer ships every subject page in its bundle.
const HomePage = React.lazy(() => import("./pages/HomePage").then(m => ({ default: m.HomePage })));
const ComparePage = React.lazy(() => import("./pages/ComparePage").then(m => ({ default: m.ComparePage })));
const LoginPage = React.lazy(() => import("./pages/LoginPage").then(m => ({ default: m.LoginPage })));
const SignupPage = React.lazy(() => import("./pages/SignupPage").then(m => ({ default: m.SignupPage })));
const ContactPage = React.lazy(() => import("./pages/ContactPage").then(m => ({ default: m.ContactPage })));
const FreeVersionPage = React.lazy(() => import("./pages/FreeVersionPage").then(m => ({ default: m.FreeVersionPage })));
const AQAFreeVersionPage = React.lazy(() => import("./pages/AQAFreeVersionPage").then(m => ({ default: m.AQAFreeVersionPage })));
const PremiumVersionPage = React.lazy(() => import("./pages/PremiumVersionPage").then(m => ({ default: m.PremiumVersionPage })));
const AQAPremiumPage = React.lazy(() => import("./pages/AQAPremiumPage").then(m => ({ default: m.AQAPremiumPage })));
const CIEFreeVersionPage = React.lazy(() => import("./pages/CIEFreeVersionPage").then(m => ({ default: m.CIEFreeVersionPage })));
const CIEPremiumPage = React.lazy(() => import("./pages/CIEPremiumPage").then(m => ({ default: m.CIEPremiumPage })));
const OCRCSFreeVersionPage = React.lazy(() => import("./pages/OCRCSFreeVersionPage").then(m => ({ default: m.OCRCSFreeVersionPage })));
const OCRCSPremiumPage = React.lazy(() => import("./pages/OCRCSPremiumPage").then(m => ({ default: m.OCRCSPremiumPage })));
const OCRPhysicsFreeVersionPage = React.lazy(() => import("./pages/OCRPhysicsFreeVersionPage").then(m => ({ default: m.OCRPhysicsFreeVersionPage })));
const OCRPhysicsPremiumPage = React.lazy(() => import("./pages/OCRPhysicsPremiumPage").then(m => ({ default: m.OCRPhysicsPremiumPage })));
const AQAChemistryFreeVersionPage = React.lazy(() => import("./pages/AQAChemistryFreeVersionPage").then(m => ({ default: m.AQAChemistryFreeVersionPage })));
const AQAChemistryPremiumPage = React.lazy(() => import("./pages/AQAChemistryPremiumPage").then(m => ({ default: m.AQAChemistryPremiumPage })));
const AQAPsychologyFreeVersionPage = React.lazy(() => import("./pages/AQAPsychologyFreeVersionPage").then(m => ({ default: m.AQAPsychologyFreeVersionPage })));
const AQAPsychologyPremiumPage = React.lazy(() => import("./pages/AQAPsychologyPremiumPage").then(m => ({ default: m.AQAPsychologyPremiumPage })));
const EdexcelMathsFreeVersionPage = React.lazy(() => import("./pages/EdexcelMathsFreeVersionPage").then(m => ({ default: m.EdexcelMathsFreeVersionPage })));
const EdexcelMathsPremiumPage = React.lazy(() => import("./pages/EdexcelMathsPremiumPage").then(m => ({ default: m.EdexcelMathsPremiumPage })));
const EdexcelMathsAppliedFreeVersionPage = React.lazy(() => import("./pages/EdexcelMathsAppliedFreeVersionPage").then(m => ({ default: m.EdexcelMathsAppliedFreeVersionPage })));
const EdexcelMathsAppliedPremiumPage = React.lazy(() => import("./pages/EdexcelMathsAppliedPremiumPage").then(m => ({ default: m.EdexcelMathsAppliedPremiumPage })));
const TestRAGChatPage = React.lazy(() => import("./pages/TestRAGChatPage").then(m => ({ default: m.TestRAGChatPage })));
const SchoolsPage = React.lazy(() => import("./pages/SchoolsPage").then(m => ({ default: m.SchoolsPage })));
const ResetPasswordPage = React.lazy(() => import("./pages/ResetPasswordPage").then(m => ({ default: m.ResetPasswordPage })));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const BuildPage = React.lazy(() => import("./pages/BuildPage").then(m => ({ default: m.BuildPage })));
const DynamicFreePage = React.lazy(() => import("./pages/DynamicFreePage").then(m => ({ default: m.DynamicFreePage })));
const DynamicPremiumPage = React.lazy(() => import("./pages/DynamicPremiumPage").then(m => ({ default: m.DynamicPremiumPage })));
const BuildAboutPage = React.lazy(() => import("./pages/BuildAboutPage").then(m => ({ default: m.BuildAboutPage })));
const GCSEComparePage = React.lazy(() => import("./pages/GCSEComparePage").then(m => ({ default: m.GCSEComparePage })));
const SubjectSelectionPage = React.lazy(() => import("./pages/SubjectSelectionPage").then(m => ({ default: m.SubjectSelectionPage })));
const AnalyticsPage = React.lazy(() => import("./pages/AnalyticsPage").then(m => ({ default: m.AnalyticsPage })));
const DashboardPage = React.lazy(() => import("./pages/DashboardPage").then(m => ({ default: m.DashboardPage })));
const ProfilePage = React.lazy(() => import("./pages/ProfilePage").then(m => ({ default: m.ProfilePage })));
const SchoolDashboardPage = React.lazy(() => import("./pages/SchoolDashboardPage").then(m => ({ default: m.SchoolDashboardPage })));
const SchoolJoinPage = React.lazy(() => import("./pages/SchoolJoinPage").then(m => ({ default: m.SchoolJoinPage })));
const FeedbackPage = React.lazy(() => import("./pages/FeedbackPage").then(m => ({ default: m.FeedbackPage })));
const FeedbackResultsPage = React.lazy(() => import("./pages/FeedbackResultsPage").then(m => ({ default: m.FeedbackResultsPage })));
const SchoolInfoPackPage = React.lazy(() => import("./pages/SchoolInfoPackPage").then(m => ({ default: m.SchoolInfoPackPage })));
const MockExamPage = React.lazy(() => import("./pages/MockExamPage").then(m => ({ default: m.MockExamPage })));
const MockExamResultsPage = React.lazy(() => import("./pages/MockExamResultsPage").then(m => ({ default: m.MockExamResultsPage })));
const AdminSeedPage = React.lazy(() => import("./pages/AdminSeedPage").then(m => ({ default: m.AdminSeedPage })));
const RevisionTopicPage = React.lazy(() => import("./pages/RevisionTopicPage").then(m => ({ default: m.RevisionTopicPage })));
const AdminContentHooksPage = React.lazy(() => import("./pages/AdminContentHooksPage").then(m => ({ default: m.AdminContentHooksPage })));
const MetricsDashboard = React.lazy(() => import("./pages/MetricsDashboard").then(m => ({ default: m.MetricsDashboard })));
const SchoolsApp = React.lazy(() => import("./pages/SchoolsApp").then(m => ({ default: m.SchoolsApp })));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

const AppContent = () => {
  useAffiliateTracking();
  useReferralCapture();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <AuthProvider>
    <ChatHistoryProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
          <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/gcse" element={<GCSEComparePage />} />
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
            <Route path="/schools" element={<SchoolsPage />} />
            {/* Legacy URL — schools marketing page moved /progress → /schools (2026-07). Vercel 308s it in prod; this covers dev + SPA fallback. */}
            <Route path="/progress" element={<Navigate to="/schools" replace />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/test-rag" element={<TestRAGChatPage />} />
            <Route path="/build" element={<BuildPage />} />
            <Route path="/build/about" element={<BuildAboutPage />} />
            <Route path="/s/:slug/free" element={<DynamicFreePage />} />
            <Route path="/s/:slug/premium" element={<DynamicPremiumPage />} />
            <Route path="/select" element={<SubjectSelectionPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/schools/info-pack" element={<SchoolInfoPackPage />} />
            <Route path="/mock-exam" element={<Navigate to="/select" replace />} />
            <Route path="/mock-exam/history" element={<Navigate to="/select" replace />} />
            <Route path="/mock-exam/:resultId" element={<MockExamPage />} />
            <Route path="/mock-exam/:resultId/results" element={<MockExamResultsPage />} />
            <Route path="/school/dashboard" element={<SchoolDashboardPage />} />
            <Route path="/school/join" element={<SchoolJoinPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/feedback-results" element={<FeedbackResultsPage />} />
            <Route path="/admin/seed" element={<AdminSeedPage />} />
            <Route path="/revision/:slug" element={<RevisionTopicPage />} />
            <Route path="/admin/content-hooks" element={<AdminContentHooksPage />} />
            <Route path="/metrics" element={<MetricsDashboard />} />
            <Route path="/schools/app/*" element={<SchoolsApp />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </ChatHistoryProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
