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
  
  const lang = isSpanish ? 'es' : 'en';
  
  const instructions = {
    es: `Eres un analista de negocios experto. Analiza la siguiente transcripción de una reunión con cliente y extrae requisitos estructurados.

INSTRUCCIONES CRÍTICAS:
1. Lee TODA la transcripción cuidadosamente
2. Identifica NECESIDADES (obligatorios, cumplimiento, restricciones, requisitos legales) vs DESEOS (preferencias, opcionales)
3. Asigna prioridades según criticidad:
   - P0: cumplimiento normativo, seguridad, SLA críticos, latencia, requisitos legales/regulatorios
   - P1: autenticación, rendimiento, capacidad offline, escalabilidad
   - P2-P3: preferencias de UI, temas, chatbots, características cosméticas
4. Para cada requisito, captura información de origen cuando esté disponible (quién lo dijo, cuándo, cita exacta)
5. IMPORTANTE: Genera contenido REAL basado en la transcripción. NO uses placeholders como [Puntos], [Decisiones], [Riesgos], etc.
6. Si la transcripción no contiene información suficiente, genera al menos un análisis básico del contenido disponible

TRANSCRIPCIÓN:
${transcriptText}

Retorna SOLO JSON válido (sin markdown, sin texto adicional) con esta estructura exacta:
{
  "customer": { "name": "nombre extraído de la transcripción o 'Cliente'", "industry": "industria identificada o 'General'" },
  "needs": [{ "id": "N-001", "text": "descripción específica del requisito necesario", "priority": "P0", "source": { "speaker": "nombre del hablante si está disponible", "timestamp": "marca de tiempo si está disponible", "quote": "cita textual si está disponible" } }],
  "wants": [{ "id": "W-001", "text": "descripción específica del requisito deseado", "priority": "P2", "source": { "speaker": null, "timestamp": null, "quote": null } }],
  "risks": ["riesgo identificado 1", "riesgo identificado 2"],
  "assumptions": ["suposición identificada 1", "suposición identificada 2"],
  "open_questions": ["pregunta pendiente 1", "pregunta pendiente 2"],
  "acceptance_criteria": ["criterio de aceptación 1", "criterio de aceptación 2"],
  "techReportMd": "# Especificación Técnica\\n\\n## Resumen Ejecutivo\\nDescripción específica de los requisitos P0/P1 identificados en la reunión...\\n\\n## Arquitectura Propuesta\\n### Componentes Principales\\n- Componente específico 1: descripción basada en la reunión\\n- Componente específico 2: descripción basada en la reunión\\n\\n### Stack Tecnológico\\nStack recomendado basado en requisitos discutidos...\\n\\n## Integraciones Requeridas\\n- Integración 1: detalles específicos\\n- Integración 2: detalles específicos\\n\\n## Criterios de Aceptación y SLOs\\n- Criterio 1 con métricas específicas\\n- Criterio 2 con métricas específicas\\n\\n## Riesgos y Mitigaciones\\n- Riesgo identificado: estrategia de mitigación\\n\\n## Supuestos Abiertos\\n- Suposición 1: necesita validación\\n- Suposición 2: necesita validación",
  "salesReportMd": "# Brief Comercial\\n\\n## Puntos Clave del Cliente\\nResumen de los puntos principales discutidos durante la reunión...\\n\\n## Decisiones Pendientes\\n- Decisión 1: contexto y stakeholder responsable\\n- Decisión 2: contexto y stakeholder responsable\\n\\n## Objeciones Identificadas\\n- Objeción 1: contexto y respuesta propuesta\\n- Objeción 2: contexto y respuesta propuesta\\n\\n## Próximos Pasos\\n- [ ] Acción específica 1 con responsable y fecha\\n- [ ] Acción específica 2 con responsable y fecha\\n- [ ] Acción específica 3 con responsable y fecha\\n\\n## Agenda Sugerida para Siguiente Reunión\\n- Tema 1: basado en conversación\\n- Tema 2: basado en conversación\\n- Tema 3: basado en conversación"
}`,
    en: `You are an expert business analyst. Analyze the following customer meeting transcript and extract structured requirements.

CRITICAL INSTRUCTIONS:
1. Read the ENTIRE transcript carefully
2. Identify NEEDS (must-haves, compliance, constraints, legal requirements) vs WANTS (preferences, nice-to-haves)
3. Assign priorities based on criticality:
   - P0: regulatory compliance, security, critical SLAs, latency, legal/regulatory requirements
   - P1: authentication, performance, offline capability, scalability
   - P2-P3: UI preferences, themes, chatbots, cosmetic features
4. For each requirement, capture source information when available (who said it, when, exact quote)
5. IMPORTANT: Generate REAL content based on the transcript. DO NOT use placeholders like [Points], [Decisions], [Risks], etc.
6. If the transcript lacks sufficient information, at least generate a basic analysis of the available content

TRANSCRIPT:
${transcriptText}

Return ONLY valid JSON (no markdown, no additional text) with this exact structure:
{
  "customer": { "name": "name extracted from transcript or 'Customer'", "industry": "identified industry or 'General'" },
  "needs": [{ "id": "N-001", "text": "specific description of required need", "priority": "P0", "source": { "speaker": "speaker name if available", "timestamp": "timestamp if available", "quote": "exact quote if available" } }],
  "wants": [{ "id": "W-001", "text": "specific description of desired want", "priority": "P2", "source": { "speaker": null, "timestamp": null, "quote": null } }],
  "risks": ["identified risk 1", "identified risk 2"],
  "assumptions": ["identified assumption 1", "identified assumption 2"],
  "open_questions": ["pending question 1", "pending question 2"],
  "acceptance_criteria": ["acceptance criterion 1", "acceptance criterion 2"],
  "techReportMd": "# Technical Specification\\n\\n## Executive Summary\\nSpecific description of P0/P1 requirements identified in the meeting...\\n\\n## Proposed Architecture\\n### Main Components\\n- Specific component 1: description based on meeting\\n- Specific component 2: description based on meeting\\n\\n### Technology Stack\\nRecommended stack based on discussed requirements...\\n\\n## Required Integrations\\n- Integration 1: specific details\\n- Integration 2: specific details\\n\\n## Acceptance Criteria & SLOs\\n- Criterion 1 with specific metrics\\n- Criterion 2 with specific metrics\\n\\n## Risks & Mitigations\\n- Identified risk: mitigation strategy\\n\\n## Open Assumptions\\n- Assumption 1: needs validation\\n- Assumption 2: needs validation",
  "salesReportMd": "# Sales Brief\\n\\n## Key Customer Points\\nSummary of main points discussed during the meeting...\\n\\n## Pending Decisions\\n- Decision 1: context and responsible stakeholder\\n- Decision 2: context and responsible stakeholder\\n\\n## Identified Objections\\n- Objection 1: context and proposed response\\n- Objection 2: context and proposed response\\n\\n## Next Steps\\n- [ ] Specific action 1 with responsible party and date\\n- [ ] Specific action 2 with responsible party and date\\n- [ ] Specific action 3 with responsible party and date\\n\\n## Suggested Agenda for Next Meeting\\n- Topic 1: based on conversation\\n- Topic 2: based on conversation\\n- Topic 3: based on conversation"
}`
  };
  
  return instructions[lang];
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
        temperature: 0.3, // Lower temperature for more focused output
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
    const parsed = JSON.parse(jsonText);
    
    // Validate that we don't have placeholder content
    const hasPlaceholders = (text: string) => {
      const placeholderPatterns = [
        /\[Points?\]/i,
        /\[Decisions?\]/i,
        /\[Risks?\]/i,
        /\[Objections?\]/i,
        /\[Criteria\]/i,
        /\[Assumptions?\]/i,
        /Component \d+$/,
        /Step \d+$/,
        /Topic \d+$/,
        /- \[/,
      ];
      return placeholderPatterns.some(pattern => pattern.test(text));
    };
    
    // Check tech and sales reports for placeholders
    if (parsed.techReportMd && hasPlaceholders(parsed.techReportMd)) {
      console.warn('Detected placeholders in techReportMd, but accepting response');
    }
    if (parsed.salesReportMd && hasPlaceholders(parsed.salesReportMd)) {
      console.warn('Detected placeholders in salesReportMd, but accepting response');
    }
    
    return parsed;
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
      .select('*, meetings(project_id, title)')
      .eq('id', transcriptId)
      .single();

    if (transcriptError || !transcript) {
      throw new Error(`Transcript not found: ${transcriptError?.message}`);
    }

    const projectId = (transcript.meetings as any).project_id;
    const meetingTitle = (transcript.meetings as any).title;

    // 2. Create analysis job
    const { data: job, error: jobError } = await supabase
      .from('analysis_jobs')
      .insert({
        transcript_id: transcriptId,
        status: 'PROCESSING',
        provider: 'GRANITE',
        name: meetingTitle || `Analysis ${new Date().toLocaleDateString()}`,
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