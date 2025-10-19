// src/app/api/orders/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { v4 as uuidv4 } from 'uuid';

type Action = 'heal' | 'revive' | 'buy';
const ACTION_PRICES: Record<Action, string> = { heal: '1.99', revive: '3.99', buy: '2.99' };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  const supabase = getSupabaseServer();

  const body = (await req.json().catch(() => null)) as { petId?: string; action?: Action } | null;
  const petId = (body?.petId ?? '').trim();
  const action = body?.action;

  if (!UUID_RE.test(petId) || !action || !(action in ACTION_PRICES)) {
    return NextResponse.json({ error: 'Bad Request', details: { petId, action } }, { status: 400 });
  }

  // ensure pet exists
  const { data: pet, error: petErr } = await supabase
    .from('pets')
    .select('id')
    .eq('id', petId)
    .maybeSingle();

  if (petErr) return NextResponse.json({ error: 'DB_ERROR', message: petErr.message }, { status: 500 });
  if (!pet)   return NextResponse.json({ error: 'Pet not found', details: { petId } }, { status: 404 });

  const orderId = uuidv4();
  const amount = ACTION_PRICES[action];

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      id: orderId,          // ✅ set id explicitly
      pet_id: petId,
      action,
      status: 'pending',
      amount,               // numeric in Postgres accepts string literals like '1.99'
    })
    .select('id,status,pet_id,action')
    .maybeSingle();

  if (error || !order) {
    return NextResponse.json({ error: 'Insert failed', message: error?.message }, { status: 500 });
  }

  return NextResponse.json({ orderId: order.id, status: order.status });
}
