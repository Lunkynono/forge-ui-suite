import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, Briefcase, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AnalysisJob } from "@/hooks/useAnalysis";

const Analyses = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisJob | null>(null);

  // Fetch all analyses for this project
  const { data: analyses, isLoading } = useQuery({
    queryKey: ['projectAnalyses', id],
    queryFn: async () => {
      // First get all transcripts for this project
      const { data: transcripts } = await supabase
        .from('transcripts')
        .select('id, meeting_id, meetings!inner(project_id)')
        .eq('meetings.project_id', id);

      if (!transcripts || transcripts.length === 0) return [];

      const transcriptIds = transcripts.map(t => t.id);

      // Then get all analyses for these transcripts
      const { data, error } = await supabase
        .from('analysis_jobs')
        .select('*')
        .in('transcript_id', transcriptIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AnalysisJob[];
    },
    enabled: !!id,
  });

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container px-4 py-12">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

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
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Analyses
          </Button>

          <PageHeader
            title={`Analysis from ${new Date(selectedAnalysis.created_at).toLocaleDateString()}`}
            description={`Provider: ${selectedAnalysis.provider} • Status: ${selectedAnalysis.status}`}
          />

          {selectedAnalysis.status === 'SUCCEEDED' && (
            <Card className="shadow-elegant mt-6">
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
            <Card className="shadow-soft mt-6">
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
            <Card className="shadow-soft mt-6">
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Navigation />
      <main className="container px-4 py-12">
        <Button
          variant="ghost"
          onClick={() => navigate(`/project/${id}`)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Project
        </Button>

        <PageHeader
          title="Analysis History"
          description="View all analyses performed on this project's transcripts"
        />

        <div className="mt-6">
          {!analyses || analyses.length === 0 ? (
            <Card className="shadow-soft">
              <CardContent className="py-12">
                <EmptyState
                  icon={FileText}
                  title="No analyses yet"
                  description="Analyses will appear here once you run them on your transcripts"
                  action={{
                    label: "Back to Project",
                    onClick: () => navigate(`/project/${id}`)
                  }}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {analyses.map((analysis) => (
                <Card
                  key={analysis.id}
                  className="shadow-soft hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedAnalysis(analysis)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          Analysis {new Date(analysis.created_at).toLocaleString()}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Provider: {analysis.provider}
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
        </div>
      </main>
    </div>
  );
};

export default Analyses;
