import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Meeting {
  id: string;
  project_id: string;
  date: string;
  title: string;
  created_at: string;
}

export function useMeetings(projectId: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['meetings', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as Meeting[];
    },
    enabled: !!projectId,
  });
}

export function useCreateMeeting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (meeting: Omit<Meeting, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('meetings')
        .insert(meeting)
        .select()
        .single();
      
      if (error) throw error;
      return data as Meeting;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meetings', variables.project_id] });
      return data;
    },
  });
}
