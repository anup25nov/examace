import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import MobileBackButtonHandler from "@/components/MobileBackButtonHandler";
import MobileAppStateManager from "@/components/MobileAppStateManager";
import MobileStatusBarHandler from "@/components/MobileStatusBarHandler";
import MobileKeyboardHandler from "@/components/MobileKeyboardHandler";
import PullToRefresh from "@/components/PullToRefresh";
import SwipeToGoBack from "@/components/SwipeToGoBack";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AboutUs from "./pages/AboutUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import { 
  AuthWrapper, 
  ExamDashboardWrapper, 
  ProfessionalExamDashboardWrapper,
  ReferralPageWrapper,
  TestInterfaceWrapper, 
  ResultAnalysisWrapper,
  SolutionsViewerWrapper
} from "@/components/LazyWrapper";
import { EnhancedExamDashboardWrapper } from "@/components/EnhancedExamDashboardWrapper";
import AdminPage from "./pages/AdminPage";
import Profile from "./pages/Profile";
import { MembershipPlans } from "./components/MembershipPlans";
import { GlobalMembershipModal } from "./components/GlobalMembershipModal";
import { MembershipProvider } from "./contexts/MembershipContext";
import { DashboardDataProvider } from "./contexts/DashboardDataContext";

const queryClient = new QueryClient();

const App = () => {
  console.log('App component rendering...');
  console.log('Environment:', import.meta.env.MODE);
  console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing');
  console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing');
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MembershipProvider>
          <DashboardDataProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <MobileBackButtonHandler />
          <MobileAppStateManager />
          <MobileStatusBarHandler />
          <MobileKeyboardHandler>
          <SwipeToGoBack>
            <Routes>
            <Route path="/auth" element={<AuthWrapper />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/exam/:examId" element={
              <ProtectedRoute>
                <EnhancedExamDashboardWrapper />
              </ProtectedRoute>
            } />
            <Route path="/exam-pro/:examId" element={
              <ProtectedRoute>
                <ProfessionalExamDashboardWrapper />
              </ProtectedRoute>
            } />
            <Route path="/referral" element={
              <ProtectedRoute>
                <ReferralPageWrapper />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/membership" element={
              <ProtectedRoute>
                <MembershipPlans onSelectPlan={() => {}} onClose={() => {}} />
              </ProtectedRoute>
            } />
            <Route path="/test/:examId/:sectionId/:testType" element={
              <ProtectedRoute>
                <TestInterfaceWrapper />
              </ProtectedRoute>
            } />
            <Route path="/test/:examId/:sectionId/:testType/:topic" element={
              <ProtectedRoute>
                <TestInterfaceWrapper />
              </ProtectedRoute>
            } />
            <Route path="/result/:examId/:sectionId" element={
              <ProtectedRoute>
                <ResultAnalysisWrapper />
              </ProtectedRoute>
            } />
            <Route path="/solutions/:examId/:sectionId/:testType" element={
              <ProtectedRoute>
                <SolutionsViewerWrapper />
              </ProtectedRoute>
            } />
            <Route path="/solutions/:examId/:sectionId/:testType/:topic" element={
              <ProtectedRoute>
                <SolutionsViewerWrapper />
              </ProtectedRoute>
            } />
            {/* Footer Pages */}
            <Route path="/about" element={<AboutUs />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<Contact />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            </Routes>
          </SwipeToGoBack>
          </MobileKeyboardHandler>
        </BrowserRouter>
        <GlobalMembershipModal />
          </DashboardDataProvider>
        </MembershipProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
