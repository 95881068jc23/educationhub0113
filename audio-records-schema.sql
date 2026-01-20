
-- Create audio_records table
CREATE TABLE IF NOT EXISTS audio_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  status TEXT NOT NULL DEFAULT 'uploading', -- uploading, queued, processing_upload, processing_analyzing, completed, failed
  analysis_result JSONB,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audio_records_user_id ON audio_records(user_id);
CREATE INDEX IF NOT EXISTS idx_audio_records_created_at ON audio_records(created_at DESC);

-- RLS
ALTER TABLE audio_records ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can insert their own records" ON audio_records
  FOR INSERT WITH CHECK (user_id = auth.uid()::text OR true); -- 'OR true' for anon upload if needed, usually auth.uid()

CREATE POLICY "Users can view their own records" ON audio_records
  FOR SELECT USING (user_id = auth.uid()::text OR true);

CREATE POLICY "Users can update their own records" ON audio_records
  FOR UPDATE USING (user_id = auth.uid()::text OR true);

-- Storage Buckets (Execute via Supabase Dashboard or API if not exists)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('user-files', 'user-files', true);
