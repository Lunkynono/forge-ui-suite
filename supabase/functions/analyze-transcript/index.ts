import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TranscriptAnalysisRequest {
  transcriptId: string;
}

// IBM watsonx.ai credentials (to be provided by user)
const WX_API_KEY = Deno.env.get('WX_API_KEY');
const WX_REGION = Deno.env.get('WX_REGION') || 'us-south';
const WX_PROJECT_ID = Deno.env.get('WX_PROJECT_ID');
const WX_MODEL_ID = Deno.env.get('WX_MODEL_ID') || 'ibm/granite-3-8b-instruct';
const WX_VERSION = Deno.env.get('WX_VERSION') || '2025-02-11';

const WX_BASE_URL = `https://${WX_REGION}.ml.cloud.ibm.com`;

// IAM token cache
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getIAMToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    console.log('Using cached IAM token');
    return cachedToken.token;
  }

  console.log('Fetching new IAM token');
  const response = await fetch('https://iam.cloud.ibm.com/identity/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${WX_API_KEY}`,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get IAM token: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const expiresIn = data.expires_in || 3600;
  
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (expiresIn * 1000),
  };

  return cachedToken.token;
}

function buildGranitePrompt(transcriptText: string, language: string): string {
  const isSpanish = language.toLowerCase().startsWith('es');
  
  return `You are an expert business analyst. Analyze the following customer meeting transcript and extract structured requirements.

INSTRUCTIONS:
1. Identify NEEDS (must-haves, compliance, constraints, legal requirements) vs WANTS (preferences, nice-to-haves)
2. Assign priorities:
   - P0: compliance, security, SLA, latency, legal, regulatory requirements
   - P1: authentication, performance, offline capability, scalability
   - P2-P3: UI preferences, themes, chatbots, cosmetic features
3. For each requirement, capture source information if available (speaker, timestamp, quote)
4. Extract customer information, risks, assumptions, questions, and acceptance criteria

TRANSCRIPT:
${transcriptText}

Return ONLY valid JSON (no markdown, no prose) with this exact structure:
{
  "customer": { "name": "string", "industry": "string" },
  "needs": [{ "id": "N-001", "text": "string", "priority": "P0|P1|P2|P3", "source": { "speaker": "string?", "timestamp": "string?", "quote": "string?" } }],
  "wants": [{ "id": "W-001", "text": "string", "priority": "P0|P1|P2|P3", "source": { "speaker": "string?", "timestamp": "string?", "quote": "string?" } }],
  "risks": ["string"],
  "assumptions": ["string"],
  "open_questions": ["string"],
  "acceptance_criteria": ["string"],
  "techReportMd": "# Technical Specification\\n\\n## Executive Summary\\n[P0/P1 requirements]\\n\\n## Proposed Architecture\\n- Component 1\\n- Component 2\\n\\n## Integrations\\n- SSO/OIDC\\n- Encryption\\n- Logging\\n\\n## Acceptance Criteria & SLOs\\n[Criteria]\\n\\n## Risks & Mitigations\\n[Risks]\\n\\n## Open Assumptions\\n[Assumptions]",
  "salesReportMd": "# Sales Brief\\n\\n## Key Customer Points\\n[Points]\\n\\n## Pending Decisions\\n[Decisions]\\n\\n## Objections\\n[Objections]\\n\\n## Next Steps\\n- [ ] Step 1\\n- [ ] Step 2\\n- [ ] Step 3\\n- [ ] Step 4\\n- [ ] Step 5\\n\\n## Suggested Agenda\\n- Topic 1\\n- Topic 2\\n- Topic 3\\n- Topic 4\\n- Topic 5"
}

${isSpanish ? 'Generate all reports in Spanish.' : 'Generate all reports in English.'}`;
}

async function callGranite(prompt: string): Promise<any> {
  if (!WX_API_KEY || !WX_PROJECT_ID) {
    throw new Error('IBM watsonx.ai credentials not configured. Please provide WX_API_KEY and WX_PROJECT_ID.');
  }

  const token = await getIAMToken();
  const url = `${WX_BASE_URL}/ml/v1/text/generation?version=${WX_VERSION}`;

  console.log(`Calling Granite at ${url}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      input: prompt,
      parameters: {
        max_new_tokens: 3000,
        temperature: 0.2,
      },
      model_id: WX_MODEL_ID,
      project_id: WX_PROJECT_ID,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Granite API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  console.log('Granite response received');
  
  return data;
}

function parseGraniteResponse(responseText: string): any {
  // Extract JSON from the response
  let jsonText = responseText.trim();
  
  // Remove markdown code blocks if present
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```\n?$/g, '');
  }
  
  try {
    return JSON.parse(jsonText);
  } catch (error: any) {
    console.error('Failed to parse JSON:', error);
    throw new Error(`Invalid JSON in Granite response: ${error.message}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcriptId } = await req.json() as TranscriptAnalysisRequest;
    console.log(`Starting analysis for transcript ${transcriptId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Load transcript
    const { data: transcript, error: transcriptError } = await supabase
      .from('transcripts')
      .select('*, meetings(project_id)')
      .eq('id', transcriptId)
      .single();

    if (transcriptError || !transcript) {
      throw new Error(`Transcript not found: ${transcriptError?.message}`);
    }

    const projectId = (transcript.meetings as any).project_id;

    // 2. Create analysis job
    const { data: job, error: jobError } = await supabase
      .from('analysis_jobs')
      .insert({
        transcript_id: transcriptId,
        status: 'PROCESSING',
        provider: 'GRANITE',
      })
      .select()
      .single();

    if (jobError || !job) {
      throw new Error(`Failed to create analysis job: ${jobError?.message}`);
    }

    const jobId = job.id;

    try {
      // 3. Build prompt and call Granite
      const prompt = buildGranitePrompt(transcript.content, transcript.language);
      const graniteResponse = await callGranite(prompt);
      
      // Extract generated text from Granite response
      const generatedText = graniteResponse.results?.[0]?.generated_text || graniteResponse.generated_text;
      
      if (!generatedText) {
        throw new Error('No generated text in Granite response');
      }

      // 4. Parse JSON response
      const analysisResult = parseGraniteResponse(generatedText);

      // 5. Update job with results
      await supabase
        .from('analysis_jobs')
        .update({
          status: 'SUCCEEDED',
          result_json: analysisResult,
          tech_report_md: analysisResult.techReportMd,
          sales_report_md: analysisResult.salesReportMd,
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      // 6. Delete old requirements for this project
      await supabase
        .from('requirements')
        .delete()
        .eq('project_id', projectId);

      // 7. Insert new requirements
      const requirements = [
        ...(analysisResult.needs || []).map((need: any) => ({
          project_id: projectId,
          kind: 'NEED',
          priority: need.priority,
          text: need.text,
          source_speaker: need.source?.speaker,
          source_timestamp: need.source?.timestamp,
          source_quote: need.source?.quote,
          requirement_id: need.id,
        })),
        ...(analysisResult.wants || []).map((want: any) => ({
          project_id: projectId,
          kind: 'WANT',
          priority: want.priority,
          text: want.text,
          source_speaker: want.source?.speaker,
          source_timestamp: want.source?.timestamp,
          source_quote: want.source?.quote,
          requirement_id: want.id,
        })),
      ];

      if (requirements.length > 0) {
        await supabase.from('requirements').insert(requirements);
      }

      // 8. Count stats
      const needsCount = analysisResult.needs?.length || 0;
      const wantsCount = analysisResult.wants?.length || 0;
      const p0Count = requirements.filter((r: any) => r.priority === 'P0').length;
      const p1Count = requirements.filter((r: any) => r.priority === 'P1').length;
      const p2Count = requirements.filter((r: any) => r.priority === 'P2').length;
      const p3Count = requirements.filter((r: any) => r.priority === 'P3').length;

      console.log(`Analysis completed for transcript ${transcriptId}`);

      return new Response(
        JSON.stringify({
          jobId,
          transcriptId,
          status: 'SUCCEEDED',
          counts: {
            needs: needsCount,
            wants: wantsCount,
            P0: p0Count,
            P1: p1Count,
            P2: p2Count,
            P3: p3Count,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (analysisError: any) {
      console.error('Analysis error:', analysisError);
      
      // Update job with error
      await supabase
        .from('analysis_jobs')
        .update({
          status: 'FAILED',
          error_message: analysisError.message,
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      throw analysisError;
    }
  } catch (error: any) {
    console.error('Error in analyze-transcript:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
