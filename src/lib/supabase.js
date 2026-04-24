import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

let supabase

try {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
} catch (err) {
  console.error('Supabase init error:', err)
  // Provide a dummy client so the app doesn't crash on load
  supabase = {
    from: () => ({
      select: () => ({ data: null, error: new Error('Supabase not initialized') }),
      insert: () => ({ data: null, error: new Error('Supabase not initialized') }),
      update: () => ({ data: null, error: new Error('Supabase not initialized') }),
      delete: () => ({ data: null, error: new Error('Supabase not initialized') }),
      eq: function() { return this },
      single: function() { return this },
      maybeSingle: function() { return this },
      not: function() { return this },
    }),
    channel: () => ({
      on: function() { return this },
      subscribe: function() { return this },
    }),
    removeChannel: () => {},
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  }
}

export { supabase }