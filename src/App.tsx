import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
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
          <Route path="/" element={<Index />} />
          <Route path="/exam/:examId" element={<ExamDashboard />} />
          <Route path="/test/:examId/:sectionId/:testType" element={<TestInterface />} />
          <Route path="/test/:examId/:sectionId/:testType/:topic" element={<TestInterface />} />
          <Route path="/result/:examId/:sectionId" element={<ResultAnalysis />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
