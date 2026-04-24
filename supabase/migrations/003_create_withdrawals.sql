-- Create withdrawals table for admin approval/rejection
DROP TABLE IF EXISTS public.withdrawals CASCADE;

CREATE TABLE public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  phone TEXT,
  mpesa_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Anonymous policies for custom auth
CREATE POLICY "Allow anonymous inserts withdrawals"
  ON public.withdrawals FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous selects withdrawals"
  ON public.withdrawals FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous updates withdrawals"
  ON public.withdrawals FOR UPDATE TO anon USING (true);

CREATE POLICY "Allow anonymous deletes withdrawals"
  ON public.withdrawals FOR DELETE TO anon USING (true);

-- Indexes
CREATE INDEX idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON public.withdrawals(status);
CREATE INDEX idx_withdrawals_created_at ON public.withdrawals(created_at DESC);
