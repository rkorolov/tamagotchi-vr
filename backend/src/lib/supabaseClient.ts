// src/lib/supabaseClient.ts
// Client-side ONLY helper. Do not import this in route handlers or server code.
'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Reuse a single instance during HMR in dev
declare global {
  // eslint-disable-next-line no-var
  var __supabaseBrowserClient: SupabaseClient | undefined;
}

export function getSupabaseBrowser(): SupabaseClient {
  if (typeof window === 'undefined') {
    // Guard against accidental server-side use
    throw new Error(
      'getSupabaseBrowser() was called on the server. Use getSupabaseServer() in server code.'
    );
  }

  if (!globalThis.__supabaseBrowserClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anon) {
      // Fail *only when actually used* on the client (not at import time)
      throw new Error(
        'Missing Supabase envs. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
      );
    }

    globalThis.__supabaseBrowserClient = createClient(url, anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return globalThis.__supabaseBrowserClient;
}
