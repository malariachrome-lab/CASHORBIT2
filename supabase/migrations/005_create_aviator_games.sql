-- Create aviator_games table for tracking game history
DROP TABLE IF EXISTS public.aviator_games CASCADE;

CREATE TABLE public.aviator_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bet_amount NUMERIC NOT NULL CHECK (bet_amount > 0),
  cashout_multiplier NUMERIC,
  crashed_at NUMERIC NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('win', 'loss')),
  winnings NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.aviator_games ENABLE ROW LEVEL SECURITY;

-- Anonymous policies
CREATE POLICY "Allow anonymous inserts aviator_games"
  ON public.aviator_games FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous selects aviator_games"
  ON public.aviator_games FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous updates aviator_games"
  ON public.aviator_games FOR UPDATE TO anon USING (true);

CREATE POLICY "Allow anonymous deletes aviator_games"
  ON public.aviator_games FOR DELETE TO anon USING (true);

-- Indexes
CREATE INDEX idx_aviator_games_user_id ON public.aviator_games(user_id);
CREATE INDEX idx_aviator_games_created_at ON public.aviator_games(created_at DESC);
