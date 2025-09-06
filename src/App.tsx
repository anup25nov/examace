import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DevAuthIndicator } from "@/components/DevAuthIndicator";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DebugInfo from "./components/DebugInfo";
import { 
  AuthWrapper, 
  ExamDashboardWrapper, 
  TestInterfaceWrapper, 
  ResultAnalysisWrapper 
} from "@/components/LazyWrapper";

const queryClient = new QueryClient();

const App = () => {
  console.log('App component rendering...');
  console.log('Environment:', import.meta.env.MODE);
  console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing');
  console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing');
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthWrapper />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/exam/:examId" element={
              <ProtectedRoute>
                <ExamDashboardWrapper />
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <DevAuthIndicator />
        {/* <DebugInfo /> */}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
