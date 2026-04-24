-- Create withdrawals table for admin approval workflow
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    method TEXT DEFAULT 'M-Pesa',
    phone TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    processed_by UUID REFERENCES public.profiles(id),
    processed_at TIMESTAMPTZ,
    rejection_reason TEXT
);

-- Enable Row Level Security
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own withdrawals
CREATE POLICY "Users can view own withdrawals"
    ON public.withdrawals
    FOR SELECT
    TO anon, authenticated
    USING (user_id = auth.uid() OR auth.uid() IS NULL);

-- Policy: Admins can view all withdrawals
CREATE POLICY "Admins can view all withdrawals"
    ON public.withdrawals
    FOR SELECT
    TO anon, authenticated
    USING (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) OR auth.uid() IS NULL);

-- Policy: Users can insert their own withdrawals
CREATE POLICY "Users can create own withdrawals"
    ON public.withdrawals
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (user_id = auth.uid() OR auth.uid() IS NULL);

-- Policy: Admins can update any withdrawal
CREATE POLICY "Admins can update withdrawals"
    ON public.withdrawals
    FOR UPDATE
    TO anon, authenticated
    USING (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) OR auth.uid() IS NULL);

-- Create live_activities table for real-time activity feed
CREATE TABLE IF NOT EXISTS public.live_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('withdrawal', 'deposit', 'task_completed', 'bonus_claimed', 'referral', 'activation')),
    user_name TEXT,
    amount NUMERIC(12,2),
    message TEXT,
    is_real BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.live_activities ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view live activities
CREATE POLICY "Anyone can view live activities"
    ON public.live_activities
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Policy: Anyone can insert live activities (for system events)
CREATE POLICY "Anyone can insert live activities"
    ON public.live_activities
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Create aviator_games table for tracking game history
CREATE TABLE IF NOT EXISTS public.aviator_games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    bet_amount NUMERIC(12,2) NOT NULL,
    multiplier NUMERIC(5,2) NOT NULL,
    crashed_at NUMERIC(5,2) NOT NULL,
    outcome TEXT NOT NULL CHECK (outcome IN ('win', 'loss')),
    winnings NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.aviator_games ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own games
CREATE POLICY "Users can view own games"
    ON public.aviator_games
    FOR SELECT
    TO anon, authenticated
    USING (user_id = auth.uid() OR auth.uid() IS NULL);

-- Policy: Admins can view all games
CREATE POLICY "Admins can view all games"
    ON public.aviator_games
    FOR SELECT
    TO anon, authenticated
    USING (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) OR auth.uid() IS NULL);

-- Policy: Users can insert their own games
CREATE POLICY "Users can insert own games"
    ON public.aviator_games
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (user_id = auth.uid() OR auth.uid() IS NULL);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON public.withdrawals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_activities_created_at ON public.live_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aviator_games_user_id ON public.aviator_games(user_id);
CREATE INDEX IF NOT EXISTS idx_aviator_games_created_at ON public.aviator_games(created_at DESC);
