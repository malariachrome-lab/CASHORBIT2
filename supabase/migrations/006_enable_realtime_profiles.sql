-- ============================================================
-- ENABLE SUPABASE REALTIME FOR PROFILES TABLE
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Add the profiles table to the supabase_realtime publication
-- This allows the client to listen to INSERT, UPDATE, DELETE changes in real-time

ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- (Optional) If the profiles table is already in the publication,
-- this command is idempotent and will safely complete with a notice.

-- Verify the table is in the publication:
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
