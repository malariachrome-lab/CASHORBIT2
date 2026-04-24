-- Create profiles table for custom auth system (no Supabase Auth dependency)
CREATE TABLE IF NOT EXISTS public.profiles (
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

-- Allow anonymous inserts for registration (custom auth system)
CREATE POLICY "Allow anonymous inserts"
  ON public.profiles
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous selects for login (custom auth system)
CREATE POLICY "Allow anonymous selects"
  ON public.profiles
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous updates for custom auth operations
CREATE POLICY "Allow anonymous updates"
  ON public.profiles
  FOR UPDATE
  TO anon
  USING (true);

-- Allow anonymous deletes for admin operations
CREATE POLICY "Allow anonymous deletes"
  ON public.profiles
  FOR DELETE
  TO anon
  USING (true);