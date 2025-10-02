-- Add name field to analysis_jobs table
ALTER TABLE analysis_jobs ADD COLUMN name TEXT;

-- Set a default name for existing records based on meeting title
UPDATE analysis_jobs
SET name = COALESCE(
  (SELECT m.title 
   FROM transcripts t 
   JOIN meetings m ON t.meeting_id = m.id 
   WHERE t.id = analysis_jobs.transcript_id),
  'Analysis ' || TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI')
)
WHERE name IS NULL;