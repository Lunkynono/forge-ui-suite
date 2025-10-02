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
import { FileText, Sparkles, Upload, Clock } from "lucide-react";
import { useMockStore } from "@/store/useMockStore";
import { toast } from "sonner";
import { z } from "zod";

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
  const { transcripts, meetings, currentProject, addTranscript, runMockAnalysis } = useMockStore();
  
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("");
  const [meetingId, setMeetingId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get sample transcripts (first 3)
  const sampleTranscripts = transcripts.slice(0, 3);
  
  // Get meetings for current project
  const projectMeetings = meetings.filter(m => m.projectId === currentProject);

  const handleAnalyze = async (transcriptId: string) => {
    toast.loading("Running analysis...", { id: transcriptId });
    await runMockAnalysis(transcriptId, "sentiment");
    toast.success("Analysis complete!", { id: transcriptId });
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

      // Create new transcript
      const newTranscript = {
        meetingId: validated.meetingId,
        projectId: meeting.projectId,
        title: `${meeting.title} - Manual Upload`,
        language: validated.language,
        duration: Math.floor(validated.content.split(' ').length / 150 * 60), // Estimate ~150 wpm
        wordCount: validated.content.split(' ').length,
        content: validated.content,
        speakers: [
          {
            id: 'spk-manual',
            name: 'Speaker',
            segments: 1,
          }
        ],
        metadata: {
          recordingQuality: 'manual',
          source: 'manual_upload',
          version: 1,
        }
      };

      addTranscript(newTranscript);
      
      toast.success("Transcript created successfully!");
      
      // Clear form
      setContent("");
      setLanguage("");
      setMeetingId("");
      
      // Navigate to project detail
      setTimeout(() => {
        navigate(`/projects/${meeting.projectId}`);
      }, 1000);
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        toast.error("Failed to create transcript");
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
                  <div className="text-center py-8 text-muted-foreground">
                    No sample transcripts available
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
                  <Label htmlFor="meeting">Meeting</Label>
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
                      No meetings found for current project
                    </p>
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
