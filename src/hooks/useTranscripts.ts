import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Transcript {
  id: string;
  meeting_id: string;
  language: string;
  content: string;
  created_at: string;
}

export function useTranscripts(meetingId: string) {
  return useQuery({
    queryKey: ['transcripts', meetingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transcripts')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Transcript[];
    },
    enabled: !!meetingId,
  });
}

export function useProjectTranscripts(projectId: string) {
  return useQuery({
    queryKey: ['projectTranscripts', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transcripts')
        .select('*, meetings!inner(project_id)')
        .eq('meetings.project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Transcript[];
    },
    enabled: !!projectId,
  });
}

export function useCreateTranscript() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (transcript: Omit<Transcript, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('transcripts')
        .insert(transcript)
        .select()
        .single();
      
      if (error) throw error;
      return data as Transcript;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transcripts', variables.meeting_id] });
    },
  });
}
