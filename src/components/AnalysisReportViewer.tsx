import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FileText, Briefcase } from "lucide-react";
import { useMockStore } from "@/store/useMockStore";
import type { AnalysisResult } from "@/lib/analyzeTranscript.mock";

interface AnalysisReportViewerProps {
  analysis: AnalysisResult;
  analysisId: string;
}

const NEXT_STEPS_ITEMS = [
  "schedule-tech-deepdive",
  "provide-pricing-proposal",
  "share-case-studies",
  "setup-demo-environment",
  "conduct-security-review",
  "finalize-architecture",
  "legal-review",
  "executive-alignment"
];

const NEXT_STEPS_LABELS = {
  "schedule-tech-deepdive": "Schedule technical deep-dive with engineering team",
  "provide-pricing-proposal": "Provide detailed pricing proposal and SOW",
  "share-case-studies": "Share case studies from similar implementations",
  "setup-demo-environment": "Set up demo environment with sample data",
  "conduct-security-review": "Conduct security and compliance review",
  "finalize-architecture": "Finalize technical architecture and integrations plan",
  "legal-review": "Legal review of contract terms and SLA",
  "executive-alignment": "Executive sponsor alignment meeting"
};

export const AnalysisReportViewer = ({ analysis, analysisId }: AnalysisReportViewerProps) => {
  const { nextSteps, toggleNextStep } = useMockStore();
  const [activeTab, setActiveTab] = useState("tech");

  return (
    <Card className="shadow-elegant border-2">
      <CardHeader className="border-b bg-secondary/30">
        <CardTitle className="text-2xl">Analysis Reports</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="tech" className="gap-2 text-base">
              <FileText className="h-5 w-5" />
              Technical Specifications
            </TabsTrigger>
            <TabsTrigger value="sales" className="gap-2 text-base">
              <Briefcase className="h-5 w-5" />
              Sales Brief
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tech" className="mt-8">
            <div className="bg-secondary/10 rounded-lg p-6 border">
              <div className="prose prose-base max-w-none dark:prose-invert prose-headings:text-primary prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-relaxed prose-li:leading-relaxed prose-strong:text-foreground">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {analysis.techReportMd}
                </ReactMarkdown>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sales" className="mt-8">
            <div className="bg-secondary/10 rounded-lg p-6 border">
              <div className="prose prose-base max-w-none dark:prose-invert prose-headings:text-primary prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-relaxed prose-li:leading-relaxed prose-strong:text-foreground">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Custom renderer for checkboxes in Next Steps section
                    ul: ({ node, children, ...props }) => {
                      const isNextSteps = node?.position?.start.line && 
                        analysis.salesReportMd.split('\n')[node.position.start.line - 2]?.includes('Next Steps');
                      
                      if (isNextSteps) {
                        return (
                          <div className="space-y-3 not-prose my-6 bg-background rounded-lg p-4 border-2 border-primary/20">
                            <h4 className="font-semibold text-lg mb-4 text-primary">Action Items</h4>
                            {NEXT_STEPS_ITEMS.map((stepId) => {
                              const stepKey = `${analysisId}-${stepId}`;
                              return (
                                <div key={stepId} className="flex items-start gap-3 p-2 hover:bg-secondary/50 rounded transition-colors">
                                  <Checkbox
                                    id={stepKey}
                                    checked={nextSteps[stepKey] || false}
                                    onCheckedChange={() => toggleNextStep(stepKey)}
                                    className="mt-1"
                                  />
                                  <Label
                                    htmlFor={stepKey}
                                    className="text-sm font-normal cursor-pointer leading-relaxed"
                                  >
                                    {NEXT_STEPS_LABELS[stepId as keyof typeof NEXT_STEPS_LABELS]}
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                        );
                      }
                      return <ul {...props}>{children}</ul>;
                    }
                  }}
                >
                  {analysis.salesReportMd}
                </ReactMarkdown>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
