import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, FileText, Briefcase, Clock, CheckCircle2, XCircle, Loader2, Plus, Search } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AnalysisJob } from "@/hooks/useAnalysis";

interface AnalysisWithMeeting extends AnalysisJob {
  meeting_title?: string;
}

const Index = () => {
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisWithMeeting | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all analyses with meeting titles
  const { data: analyses, isLoading } = useQuery({
    queryKey: ['allAnalyses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analysis_jobs')
        .select(`
          *,
          transcripts!inner(
            meeting_id,
            meetings!inner(
              title
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to include meeting_title
      return data.map(item => ({
        ...item,
        meeting_title: item.transcripts?.meetings?.title || 'Unknown Meeting'
      })) as AnalysisWithMeeting[];
    },
  });

  // Filter analyses by search query
  const filteredAnalyses = analyses?.filter(analysis => 
    analysis.meeting_title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: any }> = {
      SUCCEEDED: { variant: "default", icon: CheckCircle2 },
      PROCESSING: { variant: "secondary", icon: Loader2 },
      PENDING: { variant: "outline", icon: Clock },
      FAILED: { variant: "destructive", icon: XCircle },
    };

    const config = variants[status] || variants.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className={`h-3 w-3 ${status === 'PROCESSING' ? 'animate-spin' : ''}`} />
        {status}
      </Badge>
    );
  };

  // Detail view for selected analysis
  if (selectedAnalysis) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
        <Navigation />
        <main className="container px-4 py-12">
          <Button
            variant="ghost"
            onClick={() => setSelectedAnalysis(null)}
            className="mb-6"
          >
            <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
            Back to Analyses
          </Button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Analysis from {new Date(selectedAnalysis.created_at).toLocaleDateString()}
            </h1>
            <p className="text-muted-foreground">
              Provider: {selectedAnalysis.provider} • Status: {selectedAnalysis.status}
            </p>
          </div>

          {selectedAnalysis.status === 'SUCCEEDED' && (
            <Card className="shadow-elegant">
              <CardContent className="pt-6">
                <Tabs defaultValue="tech">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="tech" className="gap-2">
                      <FileText className="h-4 w-4" />
                      Tech Spec
                    </TabsTrigger>
                    <TabsTrigger value="sales" className="gap-2">
                      <Briefcase className="h-4 w-4" />
                      Sales Brief
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="tech" className="mt-6">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {selectedAnalysis.tech_report_md || 'No technical report available.'}
                      </ReactMarkdown>
                    </div>
                  </TabsContent>

                  <TabsContent value="sales" className="mt-6">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {selectedAnalysis.sales_report_md || 'No sales report available.'}
                      </ReactMarkdown>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {selectedAnalysis.status === 'FAILED' && (
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-destructive">Analysis Failed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {selectedAnalysis.error_message || 'An unknown error occurred.'}
                </p>
              </CardContent>
            </Card>
          )}

          {(selectedAnalysis.status === 'PROCESSING' || selectedAnalysis.status === 'PENDING') && (
            <Card className="shadow-soft">
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center gap-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-lg font-medium">Analysis in progress...</p>
                  <p className="text-sm text-muted-foreground">This may take a few minutes.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    );
  }

  // Main list view
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Navigation />
      
      {/* Hero Section */}
      <section className="container px-4 py-16 text-center border-b">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold mb-4">
            Meeting Analysis Dashboard
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Upload meeting transcripts and get AI-powered insights instantly
          </p>
          <Link to="/ingest">
            <Button size="lg" className="gap-2 shadow-elegant">
              <Plus className="h-5 w-5" />
              Get Started - New Analysis
            </Button>
          </Link>
        </div>
      </section>

      {/* Analyses List */}
      <main className="container px-4 py-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">All Analyses</h2>
          <p className="text-muted-foreground">View and manage your meeting analyses</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by meeting name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : !filteredAnalyses || filteredAnalyses.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="py-12">
              {searchQuery ? (
                <EmptyState
                  icon={Search}
                  title="No analyses found"
                  description={`No analyses match "${searchQuery}"`}
                />
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No analyses yet"
                  description="Get started by uploading a meeting transcript"
                  action={{
                    label: "Upload Transcript",
                    onClick: () => window.location.href = '/ingest'
                  }}
                />
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAnalyses.map((analysis) => (
              <Card
                key={analysis.id}
                className="shadow-soft hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedAnalysis(analysis)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {analysis.meeting_title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Provider: {analysis.provider} • {new Date(analysis.created_at).toLocaleString()}
                      </CardDescription>
                    </div>
                    {getStatusBadge(analysis.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Created: {new Date(analysis.created_at).toLocaleDateString()}
                    </div>
                    {analysis.completed_at && (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Completed: {new Date(analysis.completed_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
