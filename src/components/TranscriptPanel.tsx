import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Clock, User } from "lucide-react";
import type { Transcript } from "@/store/useMockStore";

interface TranscriptPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transcript: Transcript | null;
}

export function TranscriptPanel({ open, onOpenChange, transcript }: TranscriptPanelProps) {
  if (!transcript) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{transcript.title}</SheetTitle>
          <SheetDescription>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {Math.floor(transcript.duration / 60)}m
              </span>
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {transcript.speakers.length} speakers
              </span>
              <Badge variant="outline">{transcript.language.toUpperCase()}</Badge>
            </div>
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-10rem)] mt-6">
          <div className="space-y-4 pr-4">
            <div className="rounded-lg border bg-muted/50 p-4">
              <h4 className="font-medium mb-2">Speakers</h4>
              <div className="flex flex-wrap gap-2">
                {transcript.speakers.map((speaker) => (
                  <Badge key={speaker.id} variant="secondary">
                    {speaker.name} ({speaker.segments} segments)
                  </Badge>
                ))}
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="font-medium mb-3">Transcript Content</h4>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {transcript.content}
                </pre>
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
