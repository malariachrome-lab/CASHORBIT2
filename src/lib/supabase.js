import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://onyfxnvvazflnawbcwiy.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueWZ4bnZ2YXpmbG5hd2Jjd2l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NTg2ODgsImV4cCI6MjA5MjUzNDY4OH0.BdyQK4yY44MugXINJ2I8dv1Ws1T89rcYHfNdEAGIW4w'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
