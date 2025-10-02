import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Ingest from "./pages/Ingest";
import ProjectDetail from "./pages/ProjectDetail";
import Analyses from "./pages/Analyses";
import ShareMock from "./pages/ShareMock";
import AnalysisDemo from "./pages/AnalysisDemo";
import NotFound from "./pages/NotFound";
import { seedDatabase } from "./lib/seedDatabase";

const queryClient = new QueryClient();

const App = () => {
  // Initialize database with seed data on app start
  useEffect(() => {
    seedDatabase();
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/ingest" element={<Ingest />} />
          <Route path="/analysis-demo" element={<AnalysisDemo />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/project/:id/analyses" element={<Analyses />} />
          <Route path="/share/mock/:slug" element={<ShareMock />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
