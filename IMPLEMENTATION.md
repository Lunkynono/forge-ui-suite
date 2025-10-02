# Lovable Cloud + IBM watsonx.ai Granite Implementation

## Overview

This project has been migrated from a mock-based architecture to a real production-ready backend using:
- **Lovable Cloud** (Supabase/PostgreSQL) for data persistence
- **IBM watsonx.ai Granite** for AI-powered requirements analysis
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
**Purpose**: Analyzes transcripts using IBM watsonx.ai Granite to extract structured requirements

**IBM watsonx.ai Integration**:
- **Endpoint**: `https://{WX_REGION}.ml.cloud.ibm.com/ml/v1/text/generation?version={WX_VERSION}`
- **Authentication**: IAM Bearer token (auto-refreshed, 1-hour cache)
- **Model**: Granite 3.x instruct model (configurable via `WX_MODEL_ID`)
- **Parameters**: `max_new_tokens: 3000`, `temperature: 0.2`

**Required Secrets** (configure in Lovable Cloud):
- `WX_API_KEY` - IBM Cloud IAM API key
- `WX_REGION` - Region (e.g., `us-south`, `eu-de`)  
- `WX_PROJECT_ID` - watsonx.ai project UUID
- `WX_MODEL_ID` - Granite model ID (default: `ibm/granite-3-8b-instruct`)
- `WX_VERSION` - API version date (default: `2025-02-11`)

**Flow**:
1. Load transcript from database
2. Acquire IAM token from `https://iam.cloud.ibm.com/identity/token`
3. Build Granite prompt (see Prompt Engineering below)
4. Call Granite Text Generation API
5. Parse JSON response and validate schema
6. Store results in `analysis_jobs` table
7. Upsert requirements into `requirements` table

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

### 1. Add IBM watsonx.ai Credentials

You need to configure 5 secrets in Lovable Cloud:

```bash
WX_API_KEY         # IBM Cloud IAM API key
WX_REGION          # e.g., "us-south" or "eu-de"
WX_PROJECT_ID      # watsonx.ai project UUID
WX_MODEL_ID        # e.g., "ibm/granite-3-8b-instruct"
WX_VERSION         # e.g., "2025-02-11"
```

#### How to Get These Values:

**WX_API_KEY**:
1. Go to [IBM Cloud](https://cloud.ibm.com/)
2. Navigate to Manage > Access (IAM) > API keys
3. Create a new API key
4. Copy the key (you won't be able to see it again)

**WX_REGION**:
- Your watsonx.ai deployment region (e.g., `us-south`, `eu-de`, `eu-gb`)

**WX_PROJECT_ID**:
1. Go to [watsonx.ai](https://dataplatform.cloud.ibm.com/)
2. Open your project
3. Go to Manage > General
4. Copy the Project ID (UUID format)

**WX_MODEL_ID**:
1. Check [IBM's supported models](https://dataplatform.cloud.ibm.com/docs/content/wsj/analyze-data/fm-models.html)
2. Use Granite 3.2 if available: `ibm/granite-3-8b-instruct`
3. Or check your account for available Granite models

**WX_VERSION**:
- Use `2025-02-11` or check [IBM's API versioning docs](https://cloud.ibm.com/apidocs/watsonx-ai#versioning)

### 2. Configure Secrets in Lovable

Once you have your IBM credentials, you'll need to add them as secrets.

I've already requested the `WX_API_KEY` secret above. After you provide it, I'll need you to add the remaining secrets:

- `WX_REGION`
- `WX_PROJECT_ID`
- `WX_MODEL_ID`
- `WX_VERSION`

### 3. Test the Integration

After adding all secrets:

1. Navigate to a project
2. Go to the Overview tab
3. Click "Run Analysis"
4. The system will:
   - Call the `analyze-transcript` edge function
   - Which will authenticate with IBM Cloud
   - Call Granite with the transcript
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

### IAM Token Issues
- Tokens expire after ~1 hour and are auto-refreshed
- Check edge function logs for "Fetching new IAM token"

### Granite API Errors
- **401 Unauthorized**: Check `WX_API_KEY` is correct
- **403 Forbidden**: Verify `WX_PROJECT_ID` has access to the model
- **404 Not Found**: Check `WX_MODEL_ID` is available in your region/account

### Invalid JSON Responses
- Granite sometimes returns markdown-wrapped JSON
- The parser strips ```json blocks automatically
- If parsing fails, check edge function logs for the raw response

## Next Steps

1. **Provide IBM Credentials**: Add all 5 secrets listed above
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
- [ ] Implement retry logic for Granite API calls
- [ ] Add usage tracking and cost monitoring
- [ ] Configure backup and disaster recovery

## Documentation References

- [IBM watsonx.ai Text Generation API](https://cloud.ibm.com/apidocs/watsonx-ai#text-generation)
- [IBM Cloud IAM Token](https://cloud.ibm.com/docs/account?topic=account-iamtoken_from_apikey)
- [IBM Supported Models](https://dataplatform.cloud.ibm.com/docs/content/wsj/analyze-data/fm-models.html)
- [Lovable Cloud Docs](https://docs.lovable.dev/features/cloud)
