import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] Missing env vars:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    url: supabaseUrl || '(empty)',
    keyPrefix: supabaseAnonKey ? supabaseAnonKey.slice(0, 20) + '...' : '(empty)',
  });
} else {
  console.info('[Supabase] Client initialized:', {
    url: supabaseUrl,
    keyPrefix: supabaseAnonKey.slice(0, 20) + '...',
  });
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
