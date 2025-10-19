// src/app/api/payments/webhook/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  const raw = await req.text();

  // TODO: VERIFY signature per your Secure Acceptance profile
  // Parse the form-encoded payload:
  const fields = Object.fromEntries(new URLSearchParams(raw) as any);
  const orderId = fields['orderId'];
  const decision = fields['decision']; // e.g., 'ACCEPT', 'CANCEL', 'DECLINE'

  if (!orderId) return NextResponse.json({ error: 'missing orderId' }, { status: 400 });

  if (decision === 'ACCEPT') {
    // find order
    const { data: order } = await supabase.from('orders')
      .select('id, pet_id, action, status')
      .eq('id', orderId).single();
    if (order && order.status === 'pending') {
      // apply effect
      if (order.action === 'heal' || order.action === 'revive') {
        await supabase.from('pets').update({ state: 'healthy' }).eq('id', order.pet_id);
      }
      if (order.action === 'buy') {
        // TODO: transfer owner_id and mark listing sold
      }
      await supabase.from('orders').update({ status: 'succeeded' }).eq('id', orderId);
    }
    return NextResponse.json({ ok: true });
  } else {
    await supabase.from('orders').update({ status: decision === 'CANCEL' ? 'canceled' : 'failed' }).eq('id', orderId);
    return NextResponse.json({ ok: true });
  }
}
