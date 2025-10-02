import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Requirement {
  id: string;
  project_id: string;
  kind: 'NEED' | 'WANT';
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  text: string;
  source_speaker?: string;
  source_timestamp?: string;
  source_quote?: string;
  requirement_id?: string;
  created_at: string;
}

export interface RequirementsFilters {
  kind?: 'NEED' | 'WANT';
  priority?: 'P0' | 'P1' | 'P2' | 'P3';
  search?: string;
}

export function useRequirements(projectId: string, filters?: RequirementsFilters) {
  return useQuery({
    queryKey: ['requirements', projectId, filters],
    queryFn: async () => {
      let query = supabase
        .from('requirements')
        .select('*')
        .eq('project_id', projectId);
      
      if (filters?.kind) {
        query = query.eq('kind', filters.kind);
      }
      
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      
      if (filters?.search) {
        query = query.ilike('text', `%${filters.search}%`);
      }
      
      const { data, error } = await query.order('priority', { ascending: true });
      
      if (error) throw error;
      return data as Requirement[];
    },
    enabled: !!projectId,
  });
}
