-- Fix existing profiles table for custom auth system (no Supabase Auth dependency)
-- Run this in the Supabase SQL Editor if registration or admin queries fail

-- 1. Add password_hash column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN password_hash TEXT;
  END IF;
END $$;

-- 2. Drop FK constraint to auth.users if it exists (custom auth doesn't use auth.users)
DO $$
DECLARE
  fk_name TEXT;
BEGIN
  SELECT constraint_name INTO fk_name
  FROM information_schema.table_constraints
  WHERE table_name = 'profiles' AND constraint_type = 'FOREIGN KEY';
  
  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', fk_name);
  END IF;
END $$;

-- 3. Ensure phone is unique
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'profiles_phone_key'
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_key ON public.profiles(phone);
  END IF;
END $$;

-- 4. Drop old auth-based policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin and authenticated users can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow anonymous inserts" ON public.profiles;
DROP POLICY IF EXISTS "Allow anonymous selects" ON public.profiles;
DROP POLICY IF EXISTS "Allow anonymous updates" ON public.profiles;
DROP POLICY IF EXISTS "Allow anonymous deletes" ON public.profiles;

-- 5. Create anonymous-friendly policies for custom auth
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