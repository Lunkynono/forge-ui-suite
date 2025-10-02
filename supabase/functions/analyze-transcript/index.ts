import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Replicate from "https://esm.sh/replicate@0.25.2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TranscriptAnalysisRequest {
  transcriptId: string;
}

// Replicate configuration
const REPLICATE_API_TOKEN = Deno.env.get('REPLICATE_API_TOKEN');

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
  if (!REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN is not configured');
  }

  console.log('Calling IBM Granite on Replicate...');
  
  const replicate = new Replicate({
    auth: REPLICATE_API_TOKEN,
  });

  const output = await replicate.run(
    "ibm-granite/granite-3.3-8b-instruct",
    {
      input: {
        prompt: prompt,
        max_tokens: 4096,
        temperature: 0.7,
      }
    }
  );

  console.log('Replicate API call successful');
  
  // Replicate returns an array of strings, join them
  if (Array.isArray(output)) {
    return { generated_text: output.join('') };
  }
  
  return { generated_text: String(output) };
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
      const generatedText = graniteResponse.generated_text;
      
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