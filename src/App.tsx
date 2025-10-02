import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Ingest from "./pages/Ingest";
import ProjectDetail from "./pages/ProjectDetail";
import ShareMock from "./pages/ShareMock";
import NotFound from "./pages/NotFound";
import { useMockStore } from "./store/useMockStore";

const queryClient = new QueryClient();

const App = () => {
  // Initialize mock store on app start
  const mockStore = useMockStore();
  
  useEffect(() => {
    console.log('Mock data loaded:', {
      projects: mockStore.projects.length,
      meetings: mockStore.meetings.length,
      transcripts: mockStore.transcripts.length,
      analyses: mockStore.analyses.length,
    });
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
          <Route path="/projects/:id" element={<ProjectDetail />} />
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
