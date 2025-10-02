import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { create } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShareLinkRequest {
  projectId: string;
  expiresInDays?: number;
}

async function generateJWT(projectId: string, expiresInDays: number): Promise<string> {
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

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const payload = {
    projectId,
    exp: Math.floor(expiresAt.getTime() / 1000),
    iat: Math.floor(Date.now() / 1000),
  };

  const token = await create({ alg: 'HS256', typ: 'JWT' }, payload, key);
  return token;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, expiresInDays = 7 } = await req.json() as ShareLinkRequest;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate JWT token
    const token = await generateJWT(projectId, expiresInDays);

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Store token in database
    const { error: insertError } = await supabase
      .from('share_tokens')
      .insert({
        project_id: projectId,
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      throw new Error(`Failed to store share token: ${insertError.message}`);
    }

    // Get the origin from request headers or use a default
    const origin = req.headers.get('origin') || `https://${Deno.env.get('SUPABASE_URL')?.split('//')[1]?.split('.')[0]}.lovable.app`;
    const shareUrl = `${origin}/share/${token}`;

    console.log(`Created share link for project ${projectId}`);

    return new Response(
      JSON.stringify({ shareUrl, token, expiresAt: expiresAt.toISOString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in create-share-link:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
