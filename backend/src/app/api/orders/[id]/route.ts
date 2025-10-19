// backend/src/app/api/orders/[id]/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> } // ✅ params is a Promise
) {
  const { id } = await ctx.params;        // ✅ await it

  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('orders')
    .select('id, status, action, pet_id')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: data.id,
    status: data.status,
    action: data.action,
    petId: data.pet_id,
  });
}
