import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ExamDashboard from "./pages/ExamDashboard";
import TestInterface from "./pages/TestInterface";
import ResultAnalysis from "./pages/ResultAnalysis";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } />
          <Route path="/exam/:examId" element={
            <ProtectedRoute>
              <ExamDashboard />
            </ProtectedRoute>
          } />
          <Route path="/test/:examId/:sectionId/:testType" element={
            <ProtectedRoute>
              <TestInterface />
            </ProtectedRoute>
          } />
          <Route path="/test/:examId/:sectionId/:testType/:topic" element={
            <ProtectedRoute>
              <TestInterface />
            </ProtectedRoute>
          } />
          <Route path="/result/:examId/:sectionId" element={
            <ProtectedRoute>
              <ResultAnalysis />
            </ProtectedRoute>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
