export interface AnalysisResult {
  customer: string;
  needs: RequirementItem[];
  wants: RequirementItem[];
  risks: string[];
  assumptions: string[];
  open_questions: string[];
  acceptance_criteria: string[];
  techReportMd: string;
  salesReportMd: string;
}

export interface RequirementItem {
  text: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  speaker?: string;
  timestamp?: string;
  category?: string;
}

// Keywords for NEEDS classification
const NEEDS_KEYWORDS = {
  en: ['must', 'need', 'require', 'requirement', 'mandatory', 'critical', 'essential', 'necessary', 'compliance', 'p0', 'have to'],
  es: ['debe', 'necesita', 'requiere', 'requisito', 'obligatorio', 'crítico', 'esencial', 'necesario', 'cumplimiento', 'tiene que']
};

// Keywords for WANTS classification
const WANTS_KEYWORDS = {
  en: ['would like', 'nice to have', 'prefer', 'wish', 'hope', 'maybe', 'could', 'optional', 'bonus'],
  es: ['gustaría', 'sería bueno', 'preferiría', 'ojalá', 'quizás', 'podría', 'opcional', 'deseo']
};

// Priority classification keywords
const PRIORITY_KEYWORDS = {
  P0: ['compliance', 'security', 'latency', 'cumplimiento', 'seguridad', 'crítico', 'critical', 'must', 'debe'],
  P1: ['auth', 'authentication', 'performance', 'offline', 'rendimiento', 'autenticación', 'important', 'importante'],
  P2: ['ui', 'ux', 'interface', 'design', 'theme', 'interfaz', 'diseño', 'tema'],
  P3: ['chatbot', 'analytics', 'reporting', 'nice to have', 'sería bueno', 'optional', 'opcional']
};

/**
 * Extract speaker name from line (e.g., "Speaker: text" or "Speaker - text")
 */
function extractSpeaker(line: string): { speaker?: string; cleanText: string } {
  const speakerMatch = line.match(/^([A-Za-zÀ-ÿ\s]+)[:]\s*(.+)$/);
  if (speakerMatch) {
    return { speaker: speakerMatch[1].trim(), cleanText: speakerMatch[2] };
  }
  return { cleanText: line };
}

/**
 * Extract timestamp from line (e.g., "[00:12:34]" or "[12:34]")
 */
function extractTimestamp(text: string): { timestamp?: string; cleanText: string } {
  const timestampMatch = text.match(/\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*(.+)/);
  if (timestampMatch) {
    return { timestamp: timestampMatch[1], cleanText: timestampMatch[2] };
  }
  return { cleanText: text };
}

/**
 * Check if text contains any keywords from array (case insensitive)
 */
function containsKeywords(text: string, keywords: string[]): boolean {
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

/**
 * Classify sentence as NEED or WANT
 */
function classifyRequirement(text: string): 'need' | 'want' | null {
  const allNeedsKeywords = [...NEEDS_KEYWORDS.en, ...NEEDS_KEYWORDS.es];
  const allWantsKeywords = [...WANTS_KEYWORDS.en, ...WANTS_KEYWORDS.es];
  
  if (containsKeywords(text, allNeedsKeywords)) {
    return 'need';
  }
  if (containsKeywords(text, allWantsKeywords)) {
    return 'want';
  }
  return null;
}

/**
 * Assign priority based on content
 */
function assignPriority(text: string): 'P0' | 'P1' | 'P2' | 'P3' {
  if (containsKeywords(text, PRIORITY_KEYWORDS.P0)) return 'P0';
  if (containsKeywords(text, PRIORITY_KEYWORDS.P1)) return 'P1';
  if (containsKeywords(text, PRIORITY_KEYWORDS.P2)) return 'P2';
  return 'P3';
}

/**
 * Determine category from text content
 */
function determineCategory(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('security') || lowerText.includes('seguridad') || lowerText.includes('compliance')) {
    return 'Security & Compliance';
  }
  if (lowerText.includes('performance') || lowerText.includes('rendimiento') || lowerText.includes('latency')) {
    return 'Performance';
  }
  if (lowerText.includes('auth') || lowerText.includes('autenticación') || lowerText.includes('login')) {
    return 'Authentication';
  }
  if (lowerText.includes('ui') || lowerText.includes('ux') || lowerText.includes('interface') || lowerText.includes('design')) {
    return 'User Interface';
  }
  if (lowerText.includes('api') || lowerText.includes('integration') || lowerText.includes('integración')) {
    return 'Integration';
  }
  if (lowerText.includes('data') || lowerText.includes('database') || lowerText.includes('storage')) {
    return 'Data Management';
  }
  
  return 'General';
}

/**
 * Main analysis function
 */
export function analyzeTranscript(
  transcriptContent: string,
  projectName: string = 'Project'
): AnalysisResult {
  const needs: RequirementItem[] = [];
  const wants: RequirementItem[] = [];
  const risks: string[] = [];
  const assumptions: string[] = [];
  const open_questions: string[] = [];
  
  // Split into sentences/lines
  const lines = transcriptContent
    .split(/[.!?;\n]+/)
    .map(line => line.trim())
    .filter(line => line.length > 20); // Filter out very short fragments

  let currentSpeaker: string | undefined;
  
  for (const line of lines) {
    // Extract speaker and timestamp
    const { speaker, cleanText: textAfterSpeaker } = extractSpeaker(line);
    if (speaker) currentSpeaker = speaker;
    
    const { timestamp, cleanText } = extractTimestamp(textAfterSpeaker);
    
    // Classify the sentence
    const classification = classifyRequirement(cleanText);
    
    if (classification === 'need') {
      needs.push({
        text: cleanText,
        priority: assignPriority(cleanText),
        speaker: speaker || currentSpeaker,
        timestamp,
        category: determineCategory(cleanText)
      });
    } else if (classification === 'want') {
      wants.push({
        text: cleanText,
        priority: assignPriority(cleanText),
        speaker: speaker || currentSpeaker,
        timestamp,
        category: determineCategory(cleanText)
      });
    }
    
    // Extract risks (mentions of risk, problem, issue, concern)
    if (containsKeywords(cleanText, ['risk', 'problem', 'issue', 'concern', 'riesgo', 'problema', 'preocupación'])) {
      risks.push(cleanText);
    }
    
    // Extract assumptions (mentions of assume, expect, suppose)
    if (containsKeywords(cleanText, ['assume', 'assuming', 'expect', 'suppose', 'suponemos', 'asumimos', 'esperamos'])) {
      assumptions.push(cleanText);
    }
    
    // Extract open questions (contains question marks or question words)
    if (cleanText.includes('?') || containsKeywords(cleanText, ['how', 'what', 'when', 'where', 'why', 'cómo', 'qué', 'cuándo', 'dónde', 'por qué'])) {
      open_questions.push(cleanText);
    }
  }

  // Generate acceptance criteria from P0 and P1 needs
  const acceptance_criteria = needs
    .filter(need => need.priority === 'P0' || need.priority === 'P1')
    .map(need => `Given the requirement "${need.text}", then the system must validate and handle this correctly`);

  // Generate Tech Report
  const techReportMd = generateTechReport(projectName, needs, wants, risks, assumptions);
  
  // Generate Sales Report
  const salesReportMd = generateSalesReport(projectName, needs, wants, open_questions);

  return {
    customer: projectName,
    needs,
    wants,
    risks,
    assumptions,
    open_questions,
    acceptance_criteria,
    techReportMd,
    salesReportMd
  };
}

/**
 * Generate Technical Report in Markdown
 */
function generateTechReport(
  projectName: string,
  needs: RequirementItem[],
  wants: RequirementItem[],
  risks: string[],
  assumptions: string[]
): string {
  const p0Needs = needs.filter(n => n.priority === 'P0');
  const p1Needs = needs.filter(n => n.priority === 'P1');
  const p2p3Needs = needs.filter(n => n.priority === 'P2' || n.priority === 'P3');
  
  return `# Technical Requirements Report: ${projectName}

## Executive Summary
This document outlines the technical requirements, priorities, and risks identified from the transcript analysis.

## Critical Requirements (P0)
${p0Needs.length > 0 ? p0Needs.map((req, i) => 
  `${i + 1}. **${req.category}**: ${req.text}${req.speaker ? ` _(${req.speaker})_` : ''}`
).join('\n') : '_No P0 requirements identified_'}

## High Priority Requirements (P1)
${p1Needs.length > 0 ? p1Needs.map((req, i) => 
  `${i + 1}. **${req.category}**: ${req.text}${req.speaker ? ` _(${req.speaker})_` : ''}`
).join('\n') : '_No P1 requirements identified_'}

## Medium/Low Priority Requirements (P2-P3)
${p2p3Needs.length > 0 ? p2p3Needs.map((req, i) => 
  `${i + 1}. [${req.priority}] **${req.category}**: ${req.text}`
).join('\n') : '_No P2-P3 requirements identified_'}

## Nice-to-Have Features
${wants.length > 0 ? wants.map((req, i) => 
  `${i + 1}. [${req.priority}] ${req.text}${req.speaker ? ` _(${req.speaker})_` : ''}`
).join('\n') : '_No wants identified_'}

## Technical Risks
${risks.length > 0 ? risks.map((risk, i) => 
  `${i + 1}. ${risk}`
).join('\n') : '_No risks identified_'}

## Assumptions
${assumptions.length > 0 ? assumptions.map((assumption, i) => 
  `${i + 1}. ${assumption}`
).join('\n') : '_No assumptions identified_'}

## Implementation Roadmap

### Phase 1: Critical Features (P0)
- Focus on security, compliance, and core functionality
- Target: Weeks 1-4

### Phase 2: High Priority (P1)
- Authentication, performance optimization
- Target: Weeks 5-8

### Phase 3: Enhancement (P2-P3)
- UI improvements, additional features
- Target: Weeks 9-12

---
_Report generated on ${new Date().toISOString().split('T')[0]}_
`;
}

/**
 * Generate Sales/Business Report in Markdown
 */
function generateSalesReport(
  projectName: string,
  needs: RequirementItem[],
  wants: RequirementItem[],
  openQuestions: string[]
): string {
  const categorizedNeeds = needs.reduce((acc, need) => {
    const cat = need.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(need);
    return acc;
  }, {} as Record<string, RequirementItem[]>);

  return `# Business Requirements Report: ${projectName}

## Overview
This report summarizes the key business requirements and opportunities identified during client discussions.

## Customer Needs by Category

${Object.entries(categorizedNeeds).map(([category, items]) => `
### ${category}
${items.map((item, i) => 
  `${i + 1}. [${item.priority}] ${item.text}${item.speaker ? ` — _${item.speaker}_` : ''}`
).join('\n')}
`).join('\n')}

## Value Propositions

### Must-Have Features (Critical for Deal)
${needs.filter(n => n.priority === 'P0').map((n, i) => 
  `${i + 1}. ${n.text}`
).join('\n') || '_None identified_'}

### High-Impact Features (Competitive Advantage)
${needs.filter(n => n.priority === 'P1').map((n, i) => 
  `${i + 1}. ${n.text}`
).join('\n') || '_None identified_'}

### Enhancement Opportunities
${wants.slice(0, 5).map((w, i) => 
  `${i + 1}. ${w.text} — _Upsell opportunity_`
).join('\n') || '_None identified_'}

## Open Questions for Customer
${openQuestions.slice(0, 8).map((q, i) => 
  `${i + 1}. ${q}`
).join('\n') || '_No open questions_'}

## Next Steps
1. Schedule follow-up meeting to address open questions
2. Prepare technical feasibility assessment for P0 requirements
3. Draft proposal with phased approach
4. Identify potential upsell opportunities from "wants" list

## Deal Risk Assessment
- **High Priority Count**: ${needs.filter(n => n.priority === 'P0' || n.priority === 'P1').length} critical requirements
- **Complexity**: ${needs.length > 10 ? 'High' : needs.length > 5 ? 'Medium' : 'Low'}
- **Opportunity Size**: ${wants.length > 5 ? 'Large expansion potential' : 'Standard scope'}

---
_Report generated on ${new Date().toISOString().split('T')[0]}_
`;
}
