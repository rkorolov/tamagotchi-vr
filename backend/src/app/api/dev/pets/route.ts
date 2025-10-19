export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { getSupabaseServer } from '@/lib/supabaseServer';

export async function GET() {
  const sb = getSupabaseServer();
  const { data, error } = await sb
    .from('pets')
    .select('id, name, state')
    .limit(10);

  return new Response(JSON.stringify({ error: error ?? null, data: data ?? [] }), {
    headers: { 'Content-Type': 'application/json' },
    status: error ? 500 : 200,
  });
}