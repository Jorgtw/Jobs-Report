import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL or Anon Key is missing from environment variables. Application may not function correctly.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  }
});

// --- Raw Debug Telemetry ---
console.log("[Supabase] Client Initialized. URL:", supabaseUrl);
supabase.auth.getSession().then(({ data: { session } }) => {
  console.log("[Supabase] RAW INITIAL SESSION:", session ? `User: ${session.user.id}` : "NONE");
});
