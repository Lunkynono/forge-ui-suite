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
  
  return `# Technical Specification: ${projectName}

## Executive Summary

### Critical Requirements (P0)
${p0Needs.length > 0 ? p0Needs.map((req, i) => 
  `${i + 1}. **${req.category}**: ${req.text}${req.speaker ? ` _(${req.speaker})_` : ''}`
).join('\n') : '_No P0 requirements identified_'}

### High Priority Requirements (P1)
${p1Needs.length > 0 ? p1Needs.map((req, i) => 
  `${i + 1}. **${req.category}**: ${req.text}${req.speaker ? ` _(${req.speaker})_` : ''}`
).join('\n') : '_No P1 requirements identified_'}

---

## Proposed Architecture

### System Components
- **Frontend Layer**: React-based SPA with TypeScript
- **API Gateway**: RESTful API with rate limiting and caching
- **Business Logic**: Microservices architecture for scalability
- **Data Layer**: PostgreSQL with Redis caching layer
- **Storage**: S3-compatible object storage for files

### Technology Stack
- Frontend: React 18, TypeScript, TailwindCSS
- Backend: Node.js, Express/Fastify
- Database: PostgreSQL 15+, Redis 7+
- Infrastructure: Docker, Kubernetes, AWS/GCP

---

## Integrations

### Authentication & Authorization
- **SSO Integration**: SAML 2.0 and OAuth 2.0/OIDC support
- **Identity Providers**: Support for Okta, Azure AD, Google Workspace
- **MFA**: TOTP and WebAuthn support
- **Session Management**: JWT with refresh token rotation

### Security & Compliance
- **Encryption at Rest**: AES-256 for database and storage
- **Encryption in Transit**: TLS 1.3 for all API communications
- **Key Management**: AWS KMS or HashiCorp Vault integration
- **Audit Logging**: Comprehensive audit trail for compliance
- **Data Residency**: Configurable regional data storage

### Logging & Monitoring
- **Application Logging**: Structured JSON logs via Winston/Pino
- **Infrastructure Monitoring**: Prometheus + Grafana
- **Error Tracking**: Sentry or equivalent APM
- **Performance Monitoring**: New Relic or Datadog
- **Log Aggregation**: ELK Stack or CloudWatch

---

## Acceptance Criteria & SLOs

### Functional Acceptance Criteria
${p0Needs.slice(0, 5).map((need, i) => 
  `${i + 1}. **${need.category}**: System must ${need.text.toLowerCase()}`
).join('\n') || '_To be defined_'}

### Service Level Objectives (SLOs)
- **Availability**: 99.9% uptime (measured monthly)
- **Latency**: 
  - P50: < 200ms for API calls
  - P95: < 500ms for API calls
  - P99: < 1000ms for API calls
- **Error Rate**: < 0.1% for all requests
- **Data Durability**: 99.999999999% (11 nines)
- **Recovery Time Objective (RTO)**: < 4 hours
- **Recovery Point Objective (RPO)**: < 15 minutes

---

## Risks & Mitigations

### Technical Risks
${risks.slice(0, 5).map((risk, i) => 
  `${i + 1}. **Risk**: ${risk}\n   - _Mitigation_: To be assessed during technical design phase`
).join('\n') || '_No specific risks identified_'}

### Additional Considerations
- **Scalability**: Load testing required before production launch
- **Data Migration**: Plan needed if replacing existing system
- **Third-party Dependencies**: Risk of API changes or service outages
- **Compliance**: Regular audits required for SOC2/GDPR compliance

---

## Open Assumptions

${assumptions.map((assumption, i) => 
  `${i + 1}. ${assumption}`
).join('\n') || '_No assumptions documented_'}

### Questions for Stakeholders
- What is the expected user load at launch and in 12 months?
- Are there specific compliance requirements (GDPR, HIPAA, SOC2)?
- What is the budget for infrastructure and third-party services?
- What is the target go-live date?

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)
- Set up infrastructure and CI/CD pipelines
- Implement authentication and authorization
- Build core API framework
- ${p0Needs.length > 0 ? 'Implement P0 requirements' : 'Core functionality'}

### Phase 2: Core Features (Weeks 5-8)
- ${p1Needs.length > 0 ? 'Implement P1 requirements' : 'Primary features'}
- Integration with third-party services
- Performance optimization
- Security hardening

### Phase 3: Enhancement (Weeks 9-12)
- ${p2p3Needs.length > 0 ? 'Implement P2-P3 requirements' : 'Additional features'}
- UI/UX refinements
- Comprehensive testing
- Documentation and training materials

---

_Technical Specification v1.0 — Generated ${new Date().toISOString().split('T')[0]}_
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
  const p0Needs = needs.filter(n => n.priority === 'P0');
  const p1Needs = needs.filter(n => n.priority === 'P1');

  return `# Sales Brief: ${projectName}

## Key Points

### Must-Have Requirements (Deal Breakers)
${p0Needs.slice(0, 5).map((n, i) => 
  `${i + 1}. **${n.category}**: ${n.text}${n.speaker ? ` — _${n.speaker}_` : ''}`
).join('\n') || '_None identified_'}

### High-Impact Features (Competitive Advantage)
${p1Needs.slice(0, 5).map((n, i) => 
  `${i + 1}. **${n.category}**: ${n.text}${n.speaker ? ` — _${n.speaker}_` : ''}`
).join('\n') || '_None identified_'}

### Upsell Opportunities
${wants.slice(0, 4).map((w, i) => 
  `${i + 1}. ${w.text} — _Additional revenue potential_`
).join('\n') || '_None identified_'}

---

## Pending Decisions

### Client Decisions Required
${openQuestions.slice(0, 5).map((q, i) => 
  `${i + 1}. ${q}`
).join('\n') || '_No pending decisions_'}

### Internal Decisions Required
- Pricing structure and discount approval
- Resource allocation and timeline commitment
- Technical feasibility assessment completion
- Legal review of custom contract terms

---

## Potential Objections

### Budget Concerns
- **Objection**: "This seems expensive compared to alternatives"
- **Response**: Highlight TCO reduction through automation and efficiency gains
- **Proof Points**: ROI calculator, case studies showing 3-6 month payback

### Timeline Concerns
- **Objection**: "We need this faster than your proposed timeline"
- **Response**: Phased approach with P0 features in first release
- **Proof Points**: Reference similar projects delivered on accelerated schedule

### Technical Complexity
- **Objection**: "Our team may struggle to adopt this"
- **Response**: Comprehensive training and change management support included
- **Proof Points**: Customer success program, 24/7 support, dedicated onboarding

### Competitive Alternatives
- **Objection**: "Why not use [Competitor X]?"
- **Response**: Unique differentiators in security, compliance, and customization
- **Proof Points**: Feature comparison matrix, customer testimonials

---

## Next Steps

### Immediate Actions (This Week)
- [ ] Schedule technical deep-dive with engineering team
- [ ] Provide detailed pricing proposal and SOW
- [ ] Share case studies from similar implementations
- [ ] Set up demo environment with sample data

### Follow-up Actions (Next 2 Weeks)
- [ ] Conduct security and compliance review
- [ ] Finalize technical architecture and integrations plan
- [ ] Legal review of contract terms and SLA
- [ ] Executive sponsor alignment meeting

---

## Suggested Agenda for Next Meeting

### Meeting Objective
Align on technical requirements and move toward final proposal

### Proposed Agenda (60 minutes)

1. **Review Technical Specification** (15 min)
   - Walk through proposed architecture
   - Discuss integration points and dependencies
   - Address technical concerns

2. **Clarify Open Questions** (15 min)
   - Review pending decisions list
   - Gather missing requirements
   - Validate assumptions

3. **Demo Core Features** (15 min)
   - Show proof of concept
   - Demonstrate P0 functionality
   - Preview roadmap features

4. **Discuss Timeline & Resources** (10 min)
   - Review implementation phases
   - Identify client-side resource needs
   - Confirm key milestones

5. **Next Steps & Close** (5 min)
   - Assign action items
   - Schedule follow-up meetings
   - Confirm decision timeline

---

## Deal Assessment

- **Stage**: ${p0Needs.length > 3 ? 'Qualified - High Priority' : 'Discovery'}
- **Decision Timeline**: ${openQuestions.length < 3 ? '2-4 weeks' : '4-8 weeks (pending clarity)'}
- **Win Probability**: ${p0Needs.length > 0 && openQuestions.length < 5 ? 'High (70-80%)' : 'Medium (40-60%)'}
- **Key Stakeholders**: ${p0Needs.map(n => n.speaker).filter((s, i, arr) => s && arr.indexOf(s) === i).join(', ') || 'To be identified'}

---

_Sales Brief v1.0 — Generated ${new Date().toISOString().split('T')[0]}_
`;
}
