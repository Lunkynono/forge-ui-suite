# Lovable Cloud + IBM Granite on Replicate Implementation

## Overview

This project has been migrated from a mock-based architecture to a real production-ready backend using:
- **Lovable Cloud** (Supabase/PostgreSQL) for data persistence
- **IBM Granite 3.3-8B-Instruct** (via Replicate) for AI-powered requirements analysis
- **Deno Edge Functions** for serverless backend logic

## Architecture

### Database Schema (PostgreSQL)

```sql
-- Enums
analysis_status: PENDING | PROCESSING | SUCCEEDED | FAILED
requirement_kind: NEED | WANT  
requirement_priority: P0 | P1 | P2 | P3

-- Tables
projects (id, name, description, client_name, created_at, updated_at)
meetings (id, project_id, date, title, created_at)
transcripts (id, meeting_id, language, content, created_at)
analysis_jobs (id, transcript_id, status, provider, result_json, tech_report_md, sales_report_md, error_message, created_at, completed_at)
requirements (id, project_id, kind, priority, text, source_speaker, source_timestamp, source_quote, requirement_id, created_at)
share_tokens (id, project_id, token, expires_at, created_at)
```

### Edge Functions

#### 1. `analyze-transcript`
**Purpose**: Analyzes transcripts using IBM Granite 3.3-8B-Instruct on Replicate to extract structured requirements

**Replicate Integration**:
- **Model**: `ibm-granite/granite-3.3-8b-instruct`
- **Authentication**: Replicate API token
- **Parameters**: `max_tokens: 4096`, `temperature: 0.7`
- **Execution**: Synchronous via `replicate.run()` - no performance penalty

**Required Secrets** (configure in Lovable Cloud):
- `REPLICATE_API_TOKEN` - Your Replicate API token

**Flow**:
1. Load transcript from database
2. Build Granite prompt (see Prompt Engineering below)
3. Call Replicate API with IBM Granite model
4. Parse JSON response and validate schema
5. Store results in `analysis_jobs` table
6. Upsert requirements into `requirements` table

**Prompt Engineering**:
The prompt instructs Granite to:
- Distinguish NEEDS (compliance, legal, constraints) from WANTS (preferences)
- Assign priorities: P0 (compliance/security/SLA), P1 (auth/performance), P2-P3 (UI/cosmetic)
- Extract source attribution (speaker, timestamp, quote)
- Generate two markdown reports: Technical Specification & Sales Brief
- Return structured JSON only (no markdown/prose)

#### 2. `create-share-link`
**Purpose**: Generate shareable project links with JWT-based authentication

**Flow**:
1. Generate JWT containing `projectId` and expiration
2. Store token in `share_tokens` table
3. Return shareable URL

#### 3. `verify-share-token`
**Purpose**: Validate share tokens and return read-only project data

**Flow**:
1. Verify JWT signature and expiration
2. Check token exists in database
3. Return project, latest analysis, and requirements

### Frontend Hooks

**React Query hooks** for data fetching and mutations:
- `useProjects()`, `useProject(id)`, `useCreateProject()`
- `useMeetings(projectId)`, `useCreateMeeting()`
- `useTranscripts(meetingId)`, `useCreateTranscript()`
- `useAnalysisJob(jobId)`, `useLatestAnalysis(transcriptId)`, `useStartAnalysis()`
- `useRequirements(projectId, filters?)`
- `useCreateShareLink()`, `useVerifyShareToken()`

## Configuration Steps

### 1. Get Replicate API Token

You need to configure 1 secret in Lovable Cloud:

```bash
REPLICATE_API_TOKEN    # Your Replicate API token
```

#### How to Get Your Token:

**REPLICATE_API_TOKEN**:
1. Go to [Replicate](https://replicate.com/)
2. Sign in or create an account
3. Navigate to your [API tokens page](https://replicate.com/account/api-tokens)
4. Copy your API token

### 2. Configure Secret in Lovable

The `REPLICATE_API_TOKEN` secret has already been requested above. After you provide it, the integration will be fully configured.

The edge function automatically uses the `ibm-granite/granite-3.3-8b-instruct` model.

### 3. Test the Integration

After adding the secret:

1. Navigate to a project
2. Go to the Overview tab
3. Click "Run Analysis"
4. The system will:
   - Call the `analyze-transcript` edge function
   - Which will authenticate with Replicate
   - Call IBM Granite model with the transcript
   - Parse and store the results
   - Extract requirements

## Seed Data

The database includes seed data for testing:
- 1 Project: "FinTech Iberia"
- 2 Meetings: "Kickoff Discovery Meeting" & "Technical Requirements Discussion"
- 2 Transcripts: One in Spanish, one in English

Both transcripts include realistic requirements for a banking platform with:
- P0 requirements (PSD2, GDPR, SOC2 compliance)
- P1 requirements (2FA, Open Banking APIs, SSO)
- P2-P3 requirements (dark mode, AI chatbot)

## API Endpoints

All edge functions are accessible at:
```
https://osqpsyoyekjbncpbgeen.supabase.co/functions/v1/{function-name}
```

They are configured as **public** (no JWT required) for MVP testing.

## Troubleshooting

### Replicate API Errors
- **401 Unauthorized**: Check `REPLICATE_API_TOKEN` is correct
- **402 Payment Required**: Add credits to your Replicate account
- **429 Rate Limited**: Wait and retry with exponential backoff
- **500 Server Error**: Replicate service issue, retry later

### Invalid JSON Responses
- Granite sometimes returns markdown-wrapped JSON
- The parser strips ```json blocks automatically
- If parsing fails, check edge function logs for the raw response

## Next Steps

1. **Provide Replicate Token**: Add the `REPLICATE_API_TOKEN` secret
2. **Test Analysis**: Run analysis on seed transcripts
3. **Review Results**: Check Requirements, Tech Spec, and Sales Brief tabs
4. **Iterate on Prompts**: Tweak the Granite prompt in `analyze-transcript/index.ts` for better extraction
5. **Add Authentication**: Implement user auth for production deployment
6. **Configure RLS**: Update RLS policies to restrict access by user

## Production Checklist

- [ ] Add user authentication
- [ ] Update RLS policies (currently public for MVP)
- [ ] Add rate limiting on edge functions
- [ ] Configure proper JWT secret for share links
- [ ] Add error monitoring and alerting
- [ ] Implement retry logic for Replicate API calls
- [ ] Add usage tracking and cost monitoring
- [ ] Configure backup and disaster recovery

## Documentation References

- [Replicate Documentation](https://replicate.com/docs)
- [IBM Granite Models on Replicate](https://replicate.com/ibm-granite)
- [Lovable Cloud Docs](https://docs.lovable.dev/features/cloud)