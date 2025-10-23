// supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// Vite embeds these at build time; must start with VITE_
const url  = import.meta.env.VITE_SUPABASE_URL?.trim();
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

if (!url || !anon) {
  throw new Error(
    'Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Render.'
  );
}

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // We let the SDK read the magic-link hash and establish the session.
    detectSessionInUrl: true,
    storageKey: 'sb-grc-landing-auth',
  },
});
