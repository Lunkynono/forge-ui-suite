import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useCreateShareLink() {
  return useMutation({
    mutationFn: async (projectId: string) => {
      const { data, error } = await supabase.functions.invoke('create-share-link', {
        body: { projectId, expiresInDays: 7 },
      });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useVerifyShareToken() {
  return useMutation({
    mutationFn: async (token: string) => {
      const { data, error } = await supabase.functions.invoke('verify-share-token', {
        body: { token },
      });
      
      if (error) throw error;
      return data;
    },
  });
}
