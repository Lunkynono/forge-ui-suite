-- Create enums
CREATE TYPE public.analysis_status AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED');
CREATE TYPE public.requirement_kind AS ENUM ('NEED', 'WANT');
CREATE TYPE public.requirement_priority AS ENUM ('P0', 'P1', 'P2', 'P3');

-- Projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  client_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Meetings table
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transcripts table
CREATE TABLE public.transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT 'en',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Analysis jobs table
CREATE TABLE public.analysis_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id UUID NOT NULL REFERENCES public.transcripts(id) ON DELETE CASCADE,
  status analysis_status NOT NULL DEFAULT 'PENDING',
  provider TEXT NOT NULL DEFAULT 'GRANITE',
  result_json JSONB,
  tech_report_md TEXT,
  sales_report_md TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Requirements table
CREATE TABLE public.requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  kind requirement_kind NOT NULL,
  priority requirement_priority NOT NULL,
  text TEXT NOT NULL,
  source_speaker TEXT,
  source_timestamp TEXT,
  source_quote TEXT,
  requirement_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Share tokens table
CREATE TABLE public.share_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_tokens ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables (MVP - no auth required)
CREATE POLICY "Public read access" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON public.projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON public.projects FOR UPDATE USING (true);

CREATE POLICY "Public read access" ON public.meetings FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON public.meetings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON public.meetings FOR UPDATE USING (true);

CREATE POLICY "Public read access" ON public.transcripts FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON public.transcripts FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access" ON public.analysis_jobs FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON public.analysis_jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON public.analysis_jobs FOR UPDATE USING (true);

CREATE POLICY "Public read access" ON public.requirements FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON public.requirements FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON public.requirements FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON public.requirements FOR DELETE USING (true);

CREATE POLICY "Public read access" ON public.share_tokens FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON public.share_tokens FOR INSERT WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_meetings_project_id ON public.meetings(project_id);
CREATE INDEX idx_transcripts_meeting_id ON public.transcripts(meeting_id);
CREATE INDEX idx_analysis_jobs_transcript_id ON public.analysis_jobs(transcript_id);
CREATE INDEX idx_requirements_project_id ON public.requirements(project_id);
CREATE INDEX idx_share_tokens_token ON public.share_tokens(token);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();