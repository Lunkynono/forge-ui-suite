import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verify } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function verifyJWT(token: string): Promise<any> {
  const secret = Deno.env.get('JWT_SECRET') || 'default-secret-change-me';
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );

  try {
    const payload = await verify(token, key);
    return payload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify JWT
    const payload = await verifyJWT(token);
    const projectId = payload.projectId;

    // Check token exists in database and not expired
    const { data: shareToken, error: tokenError } = await supabase
      .from('share_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError || !shareToken) {
      throw new Error('Share link not found');
    }

    if (new Date(shareToken.expires_at) < new Date()) {
      throw new Error('Share link has expired');
    }

    // Get project data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      throw new Error('Project not found');
    }

    // Get latest analysis
    const { data: latestAnalysis } = await supabase
      .from('analysis_jobs')
      .select('*')
      .eq('transcript_id', projectId)
      .eq('status', 'SUCCEEDED')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get requirements
    const { data: requirements } = await supabase
      .from('requirements')
      .select('*')
      .eq('project_id', projectId)
      .order('priority', { ascending: true });

    return new Response(
      JSON.stringify({
        project,
        analysis: latestAnalysis,
        requirements: requirements || [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in verify-share-token:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
