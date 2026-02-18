-- ResumeAI Migration - Run in Supabase SQL Editor
-- Click "Run this query" if destructive warning appears — it is safe

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT, company TEXT, avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_postings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL, description TEXT NOT NULL, required_skills TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resumes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_posting_id UUID REFERENCES job_postings(id) ON DELETE SET NULL,
  candidate_name TEXT, candidate_email TEXT,
  file_name TEXT NOT NULL, file_path TEXT NOT NULL, file_size INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','analyzed','error')),
  match_score FLOAT DEFAULT 0,
  skills_extracted TEXT[] DEFAULT '{}', skills_matched TEXT[] DEFAULT '{}', skills_missing TEXT[] DEFAULT '{}',
  experience_years FLOAT DEFAULT 0, education_level TEXT, summary TEXT, raw_text TEXT,
  nlp_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO storage.buckets (id, name, public) VALUES ('resumes','resumes',false) ON CONFLICT (id) DO NOTHING;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid()=id);
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid()=id);
DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid()=id);

DROP POLICY IF EXISTS "job_postings_all" ON job_postings;
CREATE POLICY "job_postings_all" ON job_postings FOR ALL USING (auth.uid()=user_id);

DROP POLICY IF EXISTS "resumes_all" ON resumes;
CREATE POLICY "resumes_all" ON resumes FOR ALL USING (auth.uid()=user_id);

DROP POLICY IF EXISTS "storage_insert" ON storage.objects;
CREATE POLICY "storage_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id='resumes' AND auth.uid()::text=(string_to_array(name,'/'))[1]);
DROP POLICY IF EXISTS "storage_select" ON storage.objects;
CREATE POLICY "storage_select" ON storage.objects FOR SELECT USING (bucket_id='resumes' AND auth.uid()::text=(string_to_array(name,'/'))[1]);
DROP POLICY IF EXISTS "storage_delete" ON storage.objects;
CREATE POLICY "storage_delete" ON storage.objects FOR DELETE USING (bucket_id='resumes' AND auth.uid()::text=(string_to_array(name,'/'))[1]);

CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN INSERT INTO public.profiles(id,full_name) VALUES(NEW.id,NEW.raw_user_meta_data->>'full_name') ON CONFLICT(id) DO NOTHING; RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at=NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS resumes_updated_at ON resumes;
CREATE TRIGGER resumes_updated_at BEFORE UPDATE ON resumes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS job_postings_updated_at ON job_postings;
CREATE TRIGGER job_postings_updated_at BEFORE UPDATE ON job_postings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
