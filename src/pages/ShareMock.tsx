import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Database, Printer } from "lucide-react";
import { useMockStore } from "@/store/useMockStore";
import { AnalysisReportViewer } from "@/components/AnalysisReportViewer";
import type { AnalysisResult } from "@/lib/analyzeTranscript.mock";

const ShareMock = () => {
  const { slug } = useParams();
  const { projects, analyses } = useMockStore();
  
  // Extract project ID from slug (format: "project-name-id")
  const projectId = slug?.split('-').pop() || '';
  const project = projects.find(p => p.id === projectId);
  
  const requirementsAnalysis = analyses.find(
    a => a.projectId === projectId && a.type === 'requirements' && a.status === 'completed'
  );
  
  const analysisResults = requirementsAnalysis?.results as AnalysisResult | undefined;
  
  const allRequirements = analysisResults 
    ? [
        ...analysisResults.needs.map(n => ({ ...n, type: 'need' as const })),
        ...analysisResults.wants.map(w => ({ ...w, type: 'want' as const }))
      ]
    : [];

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Project Not Found</h1>
          <p className="text-muted-foreground">The shared project doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Minimal Header */}
      <nav className="border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center px-4">
          <div className="flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            <span className="text-xl font-semibold">DataFlow</span>
          </div>
        </div>
      </nav>

      <main className="container max-w-6xl px-4 py-12">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">{project.name}</h1>
              <p className="text-muted-foreground">{project.description}</p>
            </div>
            <Button onClick={() => window.print()} variant="outline" className="no-print">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        {analysisResults ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Requirement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allRequirements.slice(0, 20).map((req, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Badge variant={req.type === 'need' ? 'default' : 'secondary'}>
                            {req.type.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={req.priority === 'P0' ? 'destructive' : 'outline'}>
                            {req.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>{req.category}</TableCell>
                        <TableCell className="max-w-md">{req.text}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <AnalysisReportViewer
              analysis={analysisResults}
              analysisId={requirementsAnalysis?.id || 'shared'}
            />
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No analysis available for this project yet.</p>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-sm text-muted-foreground mt-8">
          This is a read-only shared view.
        </p>
      </main>
    </div>
  );
};

export default ShareMock;
