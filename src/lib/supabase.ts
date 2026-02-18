import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string
if (!url || !key) throw new Error('Missing Supabase env vars — check your .env file')
export const supabase = createClient<Database>(url, key, { auth: { autoRefreshToken:true, persistSession:true, detectSessionInUrl:true } })
