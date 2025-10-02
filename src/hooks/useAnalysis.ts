import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AnalysisJob {
  id: string;
  transcript_id: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED';
  provider: string;
  result_json: any;
  tech_report_md: string;
  sales_report_md: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export function useAnalysisJob(jobId: string) {
  return useQuery({
    queryKey: ['analysisJob', jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analysis_jobs')
        .select('*')
        .eq('id', jobId)
        .single();
      
      if (error) throw error;
      return data as AnalysisJob;
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const job = query.state.data as AnalysisJob | undefined;
      // Poll every 2 seconds if still processing
      return job?.status === 'PROCESSING' || job?.status === 'PENDING' ? 2000 : false;
    },
  });
}

export function useLatestAnalysis(transcriptId: string) {
  return useQuery({
    queryKey: ['latestAnalysis', transcriptId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analysis_jobs')
        .select('*')
        .eq('transcript_id', transcriptId)
        .eq('status', 'SUCCEEDED')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as AnalysisJob | null;
    },
    enabled: !!transcriptId,
  });
}

export function useStartAnalysis() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (transcriptId: string) => {
      const { data, error } = await supabase.functions.invoke('analyze-transcript', {
        body: { transcriptId },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['analysisJob', data.jobId] });
      queryClient.invalidateQueries({ queryKey: ['latestAnalysis'] });
      queryClient.invalidateQueries({ queryKey: ['requirements'] });
    },
  });
}
