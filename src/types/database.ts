export interface Database {
  public: {
    Tables: {
      profiles: { Row: { id:string; full_name:string|null; company:string|null; avatar_url:string|null; created_at:string; updated_at:string }; Insert: Omit<Database['public']['Tables']['profiles']['Row'],'created_at'|'updated_at'>; Update: Partial<Database['public']['Tables']['profiles']['Insert']> }
      job_postings: { Row: { id:string; user_id:string; title:string; description:string; required_skills:string[]; created_at:string; updated_at:string }; Insert: Omit<Database['public']['Tables']['job_postings']['Row'],'id'|'created_at'|'updated_at'>; Update: Partial<Database['public']['Tables']['job_postings']['Insert']> }
      resumes: { Row: { id:string; user_id:string; job_posting_id:string|null; candidate_name:string|null; candidate_email:string|null; file_name:string; file_path:string; file_size:number|null; status:'pending'|'processing'|'analyzed'|'error'; match_score:number; skills_extracted:string[]; skills_matched:string[]; skills_missing:string[]; experience_years:number; education_level:string|null; summary:string|null; raw_text:string|null; nlp_metadata:Record<string,unknown>; created_at:string; updated_at:string }; Insert: Omit<Database['public']['Tables']['resumes']['Row'],'id'|'created_at'|'updated_at'>; Update: Partial<Database['public']['Tables']['resumes']['Insert']> }
    }
  }
}
export type Profile = Database['public']['Tables']['profiles']['Row']
export type JobPosting = Database['public']['Tables']['job_postings']['Row']
export type Resume = Database['public']['Tables']['resumes']['Row']
