-- Create live_activities table for real-time activity feed
DROP TABLE IF EXISTS public.live_activities CASCADE;

CREATE TABLE public.live_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT,
  type TEXT NOT NULL CHECK (type IN ('withdrawal', 'deposit', 'task_completed', 'bonus_claimed', 'referral', 'activation', 'aviator_win', 'aviator_loss')),
  amount NUMERIC,
  message TEXT,
  is_real BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.live_activities ENABLE ROW LEVEL SECURITY;

-- Anonymous policies
CREATE POLICY "Allow anonymous inserts live_activities"
  ON public.live_activities FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous selects live_activities"
  ON public.live_activities FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous updates live_activities"
  ON public.live_activities FOR UPDATE TO anon USING (true);

CREATE POLICY "Allow anonymous deletes live_activities"
  ON public.live_activities FOR DELETE TO anon USING (true);

-- Indexes
CREATE INDEX idx_live_activities_type ON public.live_activities(type);
CREATE INDEX idx_live_activities_created_at ON public.live_activities(created_at DESC);
CREATE INDEX idx_live_activities_is_real ON public.live_activities(is_real);
