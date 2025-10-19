// src/app/api/payments/launch/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { buildHostedCheckoutPayload } from '@/lib/cybersource';

type Action = 'heal' | 'revive' | 'buy';
const ACTION_PRICES: Record<Action, string> = { heal: '1.99', revive: '3.99', buy: '2.99' };

function hasCybersourceEnv() {
  // Adjust to whatever your buildHostedCheckoutPayload actually needs
  const required = [
    'CYBERSOURCE_MERCHANT_ID',
    'CYBERSOURCE_PROFILE_ID',
    'CYBERSOURCE_ACCESS_KEY',
    'CYBERSOURCE_SECRET_KEY',
    // optional if you externalize it:
    // 'CYBERSOURCE_FORM_ACTION_URL'
  ];
  const missing = required.filter((k) => !process.env[k]);
  return { ok: missing.length === 0, missing };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get('orderId')?.trim() || '';
    const debug = url.searchParams.get('debug') === '1';

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    // 1) Check env (MOST common prod failure)
    const envCheck = hasCybersourceEnv();
    if (!envCheck.ok) {
      return NextResponse.json(
        { error: 'Missing Cybersource env', missing: envCheck.missing },
        { status: 500 }
      );
    }

    // 2) Load order
    const supabase = getSupabaseServer();
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, action, status')
      .eq('id', orderId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: 'DB_ERROR', message: error.message }, { status: 500 });
    }
    if (!order) {
      return NextResponse.json({ error: 'Order not found', orderId }, { status: 404 });
    }
    if (order.status !== 'pending') {
      return NextResponse.json({ error: 'Order not pending', status: order.status }, { status: 400 });
    }

    const action = order.action as Action;
    const amount = ACTION_PRICES[action];
    if (!amount) {
      return NextResponse.json({ error: 'Unknown action → no price', action }, { status: 400 });
    }

    // 3) Build payload (wrap in try/catch for clear error)
    let payload: ReturnType<typeof buildHostedCheckoutPayload>;
    try {
      payload = buildHostedCheckoutPayload({
        amount,
        currency: 'USD',
        reference: order.id,
        orderId: order.id,
      });
    } catch (e: any) {
      console.error('buildHostedCheckoutPayload failed:', e);
      return NextResponse.json(
        { error: 'Cybersource payload build failed', message: e?.message ?? String(e) },
        { status: 500 }
      );
    }

    // 4) Optional debug JSON (so you can see fields in prod)
    if (debug) {
      return NextResponse.json({ ok: true, payload }, { status: 200 });
    }

    // 5) Render auto-posting HTML
    const inputs = Object.entries(payload.fields)
      .map(([k, v]) => `<input type="hidden" name="${k}" value="${String(v)}" />`)
      .join('');

    const html = `<!doctype html>
<html><body onload="document.forms[0].submit()">
  <form method="post" action="${payload.formActionUrl}">
    ${inputs}
    <noscript><button type="submit">Continue to payment</button></noscript>
  </form>
</body></html>`;

    return new Response(html, { headers: { 'Content-Type': 'text/html' }, status: 200 });
  } catch (e: any) {
    console.error('payments/launch unhandled:', e);
    return NextResponse.json({ error: 'Unhandled', message: e?.message ?? String(e) }, { status: 500 });
  }
}