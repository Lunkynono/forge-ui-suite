import { useState } from "react";
import { useParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useMockStore } from "@/store/useMockStore";
import { AnalysisReportViewer } from "@/components/AnalysisReportViewer";
import { ShareDialog } from "@/components/ShareDialog";
import { TranscriptPanel } from "@/components/TranscriptPanel";
import { BarChart3, Calendar, FileText, Settings, Share2, Sparkles, Clock, User, Filter, Search, Printer, Info } from "lucide-react";
import { toast } from "sonner";
import type { AnalysisResult, RequirementItem } from "@/lib/analyzeTranscript.mock";
import type { Transcript, Meeting } from "@/store/useMockStore";

const ProjectDetail = () => {
  const { id } = useParams();
  const { projects, meetings, transcripts, analyses, runMockAnalysis, getProjectMeetings, getProjectTranscripts } = useMockStore();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [requirementFilter, setRequirementFilter] = useState<"all" | "need" | "want">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "P0" | "P1" | "P2" | "P3">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequirement, setSelectedRequirement] = useState<(RequirementItem & { type: 'need' | 'want' }) | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  const project = projects.find(p => p.id === id);
  const projectMeetings = project ? getProjectMeetings(project.id) : [];
  const projectTranscripts = project ? getProjectTranscripts(project.id) : [];
  
  // Get latest requirements analysis
  const requirementsAnalysis = analyses.find(
    a => a.projectId === id && a.type === 'requirements' && a.status === 'completed'
  );

  const handleRunAnalysis = async () => {
    if (projectTranscripts.length === 0) {
      toast.error("No transcripts available for analysis");
      return;
    }

    setIsAnalyzing(true);
    toast.loading("Running requirements analysis...", { id: 'analysis' });
    
    // Analyze first transcript
    await runMockAnalysis(projectTranscripts[0].id, 'requirements');
    
    setIsAnalyzing(false);
    toast.success("Analysis complete!", { id: 'analysis' });
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-2">Project Not Found</h1>
          <p className="text-muted-foreground">The project you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const analysisResults = requirementsAnalysis?.results as AnalysisResult | undefined;
  
  // Combine needs and wants for requirements table
  const allRequirements = analysisResults 
    ? [
        ...analysisResults.needs.map(n => ({ ...n, type: 'need' as const })),
        ...analysisResults.wants.map(w => ({ ...w, type: 'want' as const }))
      ]
    : [];

  // Apply filters and search
  const filteredRequirements = allRequirements.filter(req => {
    if (requirementFilter !== 'all' && req.type !== requirementFilter) return false;
    if (priorityFilter !== 'all' && req.priority !== priorityFilter) return false;
    if (searchQuery && !req.text.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Sort requirements: P0 > P1 > P2 > P3, then NEED > WANT
  const sortedRequirements = [...filteredRequirements].sort((a, b) => {
    const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // If same priority, NEED comes before WANT
    if (a.type === 'need' && b.type === 'want') return -1;
    if (a.type === 'want' && b.type === 'need') return 1;
    return 0;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Navigation />
      
      <main className="container px-4 py-12">
        <PageHeader
          title={project.name}
          description={project.description}
          actions={
            <>
              <Button 
                variant="outline" 
                size="icon"
                onClick={handlePrint}
                className="no-print"
              >
                <Printer className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setShareDialogOpen(true)}
                className="no-print"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </>
          }
        />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
            <TabsTrigger value="tech-spec">Tech Spec</TabsTrigger>
            <TabsTrigger value="sales-brief">Sales Brief</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="shadow-soft">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Meetings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{projectMeetings.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total recorded
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-soft">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Transcripts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{projectTranscripts.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ready for analysis
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-soft">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Last Updated
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {Math.floor((Date.now() - new Date(project.updatedAt).getTime()) / (1000 * 60 * 60))}h
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">ago</p>
                </CardContent>
              </Card>
            </div>

            {/* Run Analysis Section */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Analysis
                </CardTitle>
                <CardDescription>
                  Generate requirements analysis from transcripts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleRunAnalysis} 
                  disabled={isAnalyzing || projectTranscripts.length === 0}
                  className="w-full gap-2"
                >
                  {isAnalyzing ? "Analyzing..." : "Run Analysis"}
                </Button>
              </CardContent>
            </Card>

            {/* Recent Meetings */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Recent Meetings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {projectMeetings.length > 0 ? (
                  <div className="space-y-3">
                    {projectMeetings.slice(0, 5).map((meeting) => {
                      const meetingTranscript = projectTranscripts.find(t => t.meetingId === meeting.id);
                      return (
                        <div
                          key={meeting.id}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium">{meeting.title}</h4>
                            <p className="text-xs text-muted-foreground">
                              {new Date(meeting.date).toLocaleDateString()} • {Math.floor(meeting.duration / 60)}m
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{meeting.language.toUpperCase()}</Badge>
                            {meetingTranscript && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedMeeting(meeting);
                                  setSelectedTranscript(meetingTranscript);
                                }}
                              >
                                View Transcript
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    icon={Calendar}
                    title="No meetings yet"
                    description="Meetings will appear here once added"
                  />
                )}
              </CardContent>
            </Card>

            {/* Latest Transcripts */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Latest Transcripts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {projectTranscripts.length > 0 ? (
                  <div className="space-y-3">
                    {projectTranscripts.slice(0, 5).map((transcript) => (
                      <div
                        key={transcript.id}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                      >
                        <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium line-clamp-1">{transcript.title}</h4>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {Math.floor(transcript.duration / 60)}m
                            </span>
                            <span>{transcript.wordCount.toLocaleString()} words</span>
                            <span>{transcript.speakers.length} speakers</span>
                          </div>
                        </div>
                        <Badge variant={transcript.status === 'processed' ? 'default' : 'secondary'}>
                          {transcript.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={FileText}
                    title="No transcripts yet"
                    description="Upload or ingest transcripts to get started"
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* REQUIREMENTS TAB */}
          <TabsContent value="requirements" className="space-y-6 mt-6">
            {!analysisResults ? (
              <Card className="shadow-soft">
                <CardContent className="py-12">
                  <EmptyState
                    icon={Sparkles}
                    title="No analysis available"
                    description="Run an analysis from the Overview tab to see requirements"
                    action={{
                      label: "Go to Overview",
                      onClick: () => setActiveTab("overview")
                    }}
                  />
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Filters */}
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Filter className="h-5 w-5" />
                      Filters & Search
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <Select value={requirementFilter} onValueChange={(v: any) => setRequirementFilter(v)}>
                            <SelectTrigger className="bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover z-50">
                              <SelectItem value="all">All Types</SelectItem>
                              <SelectItem value="need">Needs Only</SelectItem>
                              <SelectItem value="want">Wants Only</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1">
                          <Select value={priorityFilter} onValueChange={(v: any) => setPriorityFilter(v)}>
                            <SelectTrigger className="bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover z-50">
                              <SelectItem value="all">All Priorities</SelectItem>
                              <SelectItem value="P0">P0 Only</SelectItem>
                              <SelectItem value="P1">P1 Only</SelectItem>
                              <SelectItem value="P2">P2 Only</SelectItem>
                              <SelectItem value="P3">P3 Only</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search requirements..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Requirements Table */}
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle>Requirements ({sortedRequirements.length})</CardTitle>
                    <CardDescription>
                      Sorted by priority (P0 → P3), then by type (Needs → Wants)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {sortedRequirements.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Requirement</TableHead>
                            <TableHead>Speaker</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedRequirements.map((req, idx) => (
                            <TableRow key={idx}>
                              <TableCell>
                                <Badge variant={req.type === 'need' ? 'default' : 'secondary'}>
                                  {req.type.toUpperCase()}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={
                                    req.priority === 'P0' ? 'destructive' : 
                                    req.priority === 'P1' ? 'default' : 
                                    'outline'
                                  }
                                >
                                  {req.priority}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">{req.category}</TableCell>
                              <TableCell className="max-w-md">
                                <p className="line-clamp-2">{req.text}</p>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {req.speaker || '—'}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedRequirement(req)}
                                >
                                  View Source
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <EmptyState
                        icon={Filter}
                        title="No requirements match filters"
                        description="Try adjusting your filter settings"
                      />
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* TECH SPEC TAB */}
          <TabsContent value="tech-spec" className="mt-6">
            {!analysisResults ? (
              <Card className="shadow-soft">
                <CardContent className="py-12">
                  <EmptyState
                    icon={FileText}
                    title="No technical specification available"
                    description="Run an analysis to generate the tech spec"
                    action={{
                      label: "Go to Overview",
                      onClick: () => setActiveTab("overview")
                    }}
                  />
                </CardContent>
              </Card>
            ) : (
              <>
                <Alert className="mb-6">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    This specification is based on the latest analysis of transcript from{' '}
                    {new Date(requirementsAnalysis?.createdAt || '').toLocaleDateString()}
                  </AlertDescription>
                </Alert>
                <AnalysisReportViewer
                  analysis={analysisResults}
                  analysisId={requirementsAnalysis?.id || 'default'}
                />
              </>
            )}
          </TabsContent>

          {/* SALES BRIEF TAB */}
          <TabsContent value="sales-brief" className="mt-6">
            {!analysisResults ? (
              <Card className="shadow-soft">
                <CardContent className="py-12">
                  <EmptyState
                    icon={FileText}
                    title="No sales brief available"
                    description="Run an analysis to generate the sales brief"
                    action={{
                      label: "Go to Overview",
                      onClick: () => setActiveTab("overview")
                    }}
                  />
                </CardContent>
              </Card>
            ) : (
              <>
                <Alert className="mb-6">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    This brief is based on the latest analysis of transcript from{' '}
                    {new Date(requirementsAnalysis?.createdAt || '').toLocaleDateString()}
                  </AlertDescription>
                </Alert>
                <AnalysisReportViewer
                  analysis={analysisResults}
                  analysisId={requirementsAnalysis?.id || 'default'}
                />
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          projectId={project.id}
          projectName={project.name}
        />

        <TranscriptPanel
          open={!!selectedTranscript}
          onOpenChange={(open) => !open && setSelectedTranscript(null)}
          transcript={selectedTranscript}
        />

        {/* View Source Dialog */}
        <Dialog open={!!selectedRequirement} onOpenChange={() => setSelectedRequirement(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Requirement Source</DialogTitle>
              <DialogDescription>
                Context from the original transcript
              </DialogDescription>
            </DialogHeader>
            {selectedRequirement && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Badge variant={selectedRequirement.type === 'need' ? 'default' : 'secondary'}>
                    {selectedRequirement.type.toUpperCase()}
                  </Badge>
                  <Badge 
                    variant={
                      selectedRequirement.priority === 'P0' ? 'destructive' : 
                      selectedRequirement.priority === 'P1' ? 'default' : 
                      'outline'
                    }
                  >
                    {selectedRequirement.priority}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {selectedRequirement.category}
                  </span>
                </div>

                <div className="border rounded-lg p-4 bg-secondary/50">
                  <p className="text-sm leading-relaxed">{selectedRequirement.text}</p>
                </div>

                {(selectedRequirement.speaker || selectedRequirement.timestamp) && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {selectedRequirement.speaker && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{selectedRequirement.speaker}</span>
                      </div>
                    )}
                    {selectedRequirement.timestamp && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{selectedRequirement.timestamp}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default ProjectDetail;
