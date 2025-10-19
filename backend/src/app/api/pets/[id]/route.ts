// src/app/api/pets/[id]/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

// Note: params is a Promise in Next 15+
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params; // <-- await the params

  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('pets')
    .select('id,state,owner_id')
    .eq('id', id)
    .single();

  if (error || !data) {
    // (Optional while debugging) return the error message:
    // return NextResponse.json({ error: error?.message ?? 'Not found' }, { status: error ? 500 : 404 });
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: data.id,
    state: data.state,
    ownerId: data.owner_id,
  });
}
