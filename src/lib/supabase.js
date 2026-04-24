import { createClient } from '@supabase/supabase-js'

// Hardcoded credentials as reliable fallback so the app works on Vercel
// even if env vars are not injected at build time.
const HARDCODED_URL = 'https://ivzfvytboqnfvwqayjkm.supabase.co'
const HARDCODED_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2emZ2eXRib3FuZnZ3cWF5amttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMjkzNDMsImV4cCI6MjA5MjYwNTM0M30.8Pd1fF1z67PWtt_tqy0Lb8i1tFV-asjKqRW9YtBWwT8'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || HARDCODED_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || HARDCODED_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)