import { Navigation } from "@/components/Navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMockStore } from "@/store/useMockStore";
import { AnalysisReportViewer } from "@/components/AnalysisReportViewer";
import { Sparkles, Clock } from "lucide-react";
import { toast } from "sonner";
import type { AnalysisResult } from "@/lib/analyzeTranscript.mock";

const AnalysisDemo = () => {
  const { transcripts, runMockAnalysis, analyses } = useMockStore();
  
  // Get first transcript for demo
  const demoTranscript = transcripts[0];
  
  // Find requirements analysis for this transcript
  const requirementsAnalysis = analyses.find(
    a => a.transcriptId === demoTranscript?.id && a.type === 'requirements' && a.status === 'completed'
  );

  const handleRunAnalysis = async () => {
    if (!demoTranscript) {
      toast.error("No transcript available");
      return;
    }

    toast.loading("Running requirements analysis...", { id: 'analysis' });
    await runMockAnalysis(demoTranscript.id, 'requirements');
    toast.success("Analysis complete!", { id: 'analysis' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Navigation />
      
      <main className="container max-w-6xl px-4 py-12">
        <PageHeader
          title="Analysis Reports Demo"
          description="View AI-generated technical specifications and sales briefs"
        />

        {!demoTranscript ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No transcripts available for analysis</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Transcript Info Card */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{demoTranscript.title}</span>
                  <Badge variant="outline">{demoTranscript.language.toUpperCase()}</Badge>
                </CardTitle>
                <CardDescription className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {Math.floor(demoTranscript.duration / 60)}m
                  </span>
                  <span>{demoTranscript.wordCount.toLocaleString()} words</span>
                  <span>{demoTranscript.speakers.length} speakers</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!requirementsAnalysis ? (
                  <Button onClick={handleRunAnalysis} className="gap-2 w-full">
                    <Sparkles className="h-4 w-4" />
                    Run Requirements Analysis
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="h-4 w-4 text-green-600" />
                    <span>Analysis completed</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Analysis Reports */}
            {requirementsAnalysis && requirementsAnalysis.results && (
              <AnalysisReportViewer
                analysis={requirementsAnalysis.results as AnalysisResult}
                analysisId={requirementsAnalysis.id}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AnalysisDemo;
