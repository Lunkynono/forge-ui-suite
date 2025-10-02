import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { FileText, Sparkles, Upload, Clock } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useMeetings, useCreateMeeting } from "@/hooks/useMeetings";
import { useTranscripts } from "@/hooks/useTranscripts";
import { useStartAnalysis } from "@/hooks/useAnalysis";
import { useProjects } from "@/hooks/useProjects";

const transcriptSchema = z.object({
  content: z.string()
    .trim()
    .min(10, { message: "Transcript must be at least 10 characters" })
    .max(100000, { message: "Transcript must be less than 100,000 characters" }),
  language: z.string().min(1, { message: "Please select a language" }),
  meetingId: z.string().min(1, { message: "Please select a meeting" }),
});

const Ingest = () => {
  const navigate = useNavigate();
  const { data: projects } = useProjects();
  const currentProject = projects?.[0]; // Use first project for now
  
  const { data: meetings = [] } = useMeetings(currentProject?.id || '');
  const { data: transcripts = [] } = useTranscripts(currentProject?.id || '');
  const startAnalysis = useStartAnalysis();
  const createMeeting = useCreateMeeting();
  
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("en");
  const [meetingId, setMeetingId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newMeetingTitle, setNewMeetingTitle] = useState("");
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  
  // Get sample transcripts (empty for now - can add examples later)
  const sampleTranscripts: any[] = [];
  
  // Get meetings for current project
  const projectMeetings = meetings;

  const handleAnalyze = async (transcriptId: string) => {
    toast.loading("Starting analysis...", { id: transcriptId });
    try {
      await startAnalysis.mutateAsync(transcriptId);
      toast.success("Analysis started! View progress in project details.", { id: transcriptId });
    } catch (error) {
      toast.error("Failed to start analysis", { id: transcriptId });
      console.error(error);
    }
  };

  const handleCreateMeeting = async () => {
    if (!newMeetingTitle.trim()) {
      toast.error("Please enter a meeting title");
      return;
    }

    if (!currentProject) {
      toast.error("No project selected");
      return;
    }

    try {
      const meeting = await createMeeting.mutateAsync({
        project_id: currentProject.id,
        title: newMeetingTitle,
        date: new Date().toISOString(),
      });

      setMeetingId(meeting.id);
      setNewMeetingTitle("");
      setShowNewMeeting(false);
      toast.success("Meeting created!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create meeting");
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Validate input
      const validated = transcriptSchema.parse({
        content,
        language,
        meetingId,
      });

      const meeting = meetings.find(m => m.id === meetingId);
      if (!meeting) {
        toast.error("Selected meeting not found");
        return;
      }

      // Create new transcript in Supabase
      const { data: transcript, error: transcriptError } = await supabase
        .from('transcripts')
        .insert({
          meeting_id: validated.meetingId,
          language: validated.language,
          content: validated.content,
        })
        .select()
        .single();

      if (transcriptError) throw transcriptError;

      toast.success("Transcript created successfully!");
      
      // Start analysis immediately
      toast.loading("Starting analysis...", { id: 'analysis' });
      try {
        await startAnalysis.mutateAsync(transcript.id);
        toast.success("Analysis started!", { id: 'analysis' });
      } catch (analysisError) {
        console.error(analysisError);
        toast.error("Transcript saved but analysis failed to start", { id: 'analysis' });
      }
      
      // Clear form
      setContent("");
      setLanguage("en");
      setMeetingId("");
      
      // Navigate to project detail
      setTimeout(() => {
        navigate(`/projects/${meeting.project_id}`);
      }, 1500);
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        toast.error("Failed to create transcript");
        console.error(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const charCount = content.length;
  const charLimit = 100000;
  const isOverLimit = charCount > charLimit;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Navigation />
      
      <main className="container max-w-6xl px-4 py-12">
        <PageHeader
          title="Ingest Data"
          description="Upload transcripts or use existing examples"
        />

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Use Examples Card */}
          <Card className="shadow-soft hover:shadow-elegant transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Use Examples
              </CardTitle>
              <CardDescription>
                Explore pre-loaded transcripts from various projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sampleTranscripts.map((transcript) => {
                  const meeting = meetings.find(m => m.id === transcript.meetingId);
                  
                  return (
                    <div
                      key={transcript.id}
                      className="border rounded-lg p-4 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium line-clamp-1">{transcript.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {meeting?.title}
                          </p>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {transcript.language.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {Math.floor(transcript.duration / 60)}m
                        </span>
                        <span>{transcript.wordCount.toLocaleString()} words</span>
                        <span>{transcript.speakers.length} speakers</span>
                      </div>
                      
                      <Button 
                        size="sm" 
                        className="w-full gap-2"
                        onClick={() => handleAnalyze(transcript.id)}
                      >
                        <Sparkles className="h-4 w-4" />
                        Analyze
                      </Button>
                    </div>
                  );
                })}
                
                {sampleTranscripts.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No example transcripts available</p>
                    <p className="text-sm text-muted-foreground mt-1">Upload a transcript to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Paste Text Card */}
          <Card className="shadow-soft hover:shadow-elegant transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Paste Text
              </CardTitle>
              <CardDescription>
                Manually upload a transcript from your meeting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
                {/* Language Select */}
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="language" className="bg-background">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish (Español)</SelectItem>
                      <SelectItem value="pt">Portuguese (Português)</SelectItem>
                      <SelectItem value="fr">French (Français)</SelectItem>
                      <SelectItem value="de">German (Deutsch)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Meeting Select */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="meeting">Meeting</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNewMeeting(!showNewMeeting)}
                      className="h-auto py-1 px-2 text-xs"
                    >
                      {showNewMeeting ? 'Select Existing' : '+ Create New'}
                    </Button>
                  </div>

                  {showNewMeeting ? (
                    <div className="flex gap-2">
                      <Input
                        placeholder="New meeting title..."
                        value={newMeetingTitle}
                        onChange={(e) => setNewMeetingTitle(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleCreateMeeting}
                        disabled={!newMeetingTitle.trim()}
                      >
                        Create
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Select value={meetingId} onValueChange={setMeetingId}>
                        <SelectTrigger id="meeting" className="bg-background">
                          <SelectValue placeholder="Select meeting" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          {projectMeetings.map((meeting) => (
                            <SelectItem key={meeting.id} value={meeting.id}>
                              {meeting.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {projectMeetings.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          No meetings found. Create a new one above.
                        </p>
                      )}
                    </>
                  )}
                </div>

                <Separator />

                {/* Textarea */}
                <div className="space-y-2">
                  <Label htmlFor="content">Transcript Content</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste your transcript here..."
                    rows={12}
                    className="resize-none font-mono text-sm"
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className={isOverLimit ? "text-destructive" : "text-muted-foreground"}>
                      {charCount.toLocaleString()} / {charLimit.toLocaleString()} characters
                    </span>
                    {isOverLimit && (
                      <span className="text-destructive font-medium">
                        Character limit exceeded
                      </span>
                    )}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full gap-2"
                  disabled={isSubmitting || isOverLimit || !content || !language || !meetingId}
                >
                  {isSubmitting ? "Creating..." : "Create Transcript"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Ingest;
