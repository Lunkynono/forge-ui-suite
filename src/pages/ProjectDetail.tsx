import { useState, useEffect } from "react";
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
import { ShareDialog } from "@/components/ShareDialog";
import { BarChart3, Calendar, FileText, Settings, Share2, Sparkles, Clock, User, Filter, Search, Printer, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useProjects } from "@/hooks/useProjects";
import { useMeetings } from "@/hooks/useMeetings";
import { useTranscripts } from "@/hooks/useTranscripts";
import { useRequirements } from "@/hooks/useRequirements";
import { useStartAnalysis, useLatestAnalysis } from "@/hooks/useAnalysis";

const ProjectDetail = () => {
  const { id } = useParams();
  
  const { data: projects } = useProjects();
  const { data: meetings = [] } = useMeetings(id || '');
  const { data: transcripts = [] } = useTranscripts(id || '');
  const { data: requirements = [] } = useRequirements(id || '');
  
  const project = projects?.find(p => p.id === id);
  
  const [activeTab, setActiveTab] = useState("overview");
  const [requirementFilter, setRequirementFilter] = useState<"all" | "NEED" | "WANT">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "P0" | "P1" | "P2" | "P3">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequirement, setSelectedRequirement] = useState<any | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

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

  // Apply filters and search to requirements
  const filteredRequirements = requirements.filter(req => {
    if (requirementFilter !== 'all' && req.kind !== requirementFilter) return false;
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
    if (a.kind === 'NEED' && b.kind === 'WANT') return -1;
    if (a.kind === 'WANT' && b.kind === 'NEED') return 1;
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analyses">Analyses</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
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
                  <div className="text-3xl font-bold">{meetings.length}</div>
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
                  <div className="text-3xl font-bold">{transcripts.length}</div>
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
                    {Math.floor((Date.now() - new Date(project.updated_at).getTime()) / (1000 * 60 * 60))}h
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">ago</p>
                </CardContent>
              </Card>
            </div>


            {/* Recent Meetings */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Recent Meetings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {meetings.length > 0 ? (
                  <div className="space-y-3">
                    {meetings.slice(0, 5).map((meeting) => {
                      const meetingTranscript = transcripts.find(t => t.meeting_id === meeting.id);
                      return (
                        <div
                          key={meeting.id}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium">{meeting.title}</h4>
                            <p className="text-xs text-muted-foreground">
                              {new Date(meeting.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {meetingTranscript && (
                              <Badge variant="outline">Has Transcript</Badge>
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
                {transcripts.length > 0 ? (
                  <div className="space-y-3">
                    {transcripts.slice(0, 5).map((transcript) => {
                      const meeting = meetings.find(m => m.id === transcript.meeting_id);
                      return (
                      <div
                          key={transcript.id}
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                        >
                          <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-medium line-clamp-1">{meeting?.title || 'Transcript'}</h4>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              <span>{transcript.language.toUpperCase()}</span>
                              <span>{transcript.content.split(' ').length.toLocaleString()} words</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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

          {/* ANALYSES TAB */}
          <TabsContent value="analyses" className="space-y-6 mt-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Analysis History</CardTitle>
                <CardDescription>View all analyses performed on this project</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => window.location.href = `/project/${id}/analyses`}>
                  View All Analyses
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* REQUIREMENTS TAB */}
          <TabsContent value="requirements" className="space-y-6 mt-6">
            {requirements.length === 0 ? (
              <Card className="shadow-soft">
                <CardContent className="py-12">
                  <EmptyState
                    icon={Sparkles}
                    title="No requirements available"
                    description="Requirements will appear here after running an analysis"
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
                                <SelectItem value="NEED">Needs Only</SelectItem>
                                <SelectItem value="WANT">Wants Only</SelectItem>
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
                            <TableRow key={req.id}>
                              <TableCell>
                                <Badge variant={req.kind === 'NEED' ? 'default' : 'secondary'}>
                                  {req.kind}
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
                              <TableCell className="font-medium">—</TableCell>
                              <TableCell className="max-w-md">
                                <p className="line-clamp-2">{req.text}</p>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {req.source_speaker || '—'}
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

        </Tabs>

        {/* Dialogs */}
        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          projectId={project.id}
          projectName={project.name}
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
                  <Badge variant={selectedRequirement.kind === 'NEED' ? 'default' : 'secondary'}>
                    {selectedRequirement.kind}
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
                </div>

                <div className="border rounded-lg p-4 bg-secondary/50">
                  <p className="text-sm leading-relaxed">{selectedRequirement.text}</p>
                </div>

                {(selectedRequirement.source_speaker || selectedRequirement.source_timestamp) && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {selectedRequirement.source_speaker && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{selectedRequirement.source_speaker}</span>
                      </div>
                    )}
                    {selectedRequirement.source_timestamp && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{selectedRequirement.source_timestamp}</span>
                      </div>
                    )}
                  </div>
                )}

                {selectedRequirement.source_quote && (
                  <div className="border-l-2 border-primary pl-4">
                    <p className="text-sm italic text-muted-foreground">{selectedRequirement.source_quote}</p>
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
