// src/lib/supabaseServer.ts
import { createClient } from '@supabase/supabase-js';

export function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase envs: NEXT_PUBLIC_SUPABASE_URL and server key');
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
