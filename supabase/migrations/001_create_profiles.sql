-- ============================================================
-- CASH ORBIT - DATABASE SETUP (Run this in Supabase SQL Editor)
-- ============================================================
-- 1. Go to https://app.supabase.com/project/ivzfvytboqnfvwqayjkm
-- 2. Click "SQL Editor" in the left sidebar
-- 3. Paste ALL of this SQL
-- 4. Click "Run"
-- ============================================================

-- Drop existing table and policies to start fresh (safe on empty/new DB)
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create profiles table for CUSTOM auth (no Supabase Auth dependency)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  name TEXT,
  phone TEXT UNIQUE,
  password_hash TEXT,
  balance NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  role TEXT DEFAULT 'user',
  referral_code TEXT,
  referred_by TEXT,
  transaction_id TEXT,
  business_tills JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create anonymous-friendly policies (custom auth system)
CREATE POLICY "Allow anonymous inserts"
  ON public.profiles
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous selects"
  ON public.profiles
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous updates"
  ON public.profiles
  FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous deletes"
  ON public.profiles
  FOR DELETE
  TO anon
  USING (true);

-- Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);

-- ============================================================
-- DONE! Registration and admin will now work.
-- ============================================================