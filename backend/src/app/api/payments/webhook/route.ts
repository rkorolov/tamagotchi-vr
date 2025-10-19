import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { markOrderSucceededMock } from '@/lib/orderService';

/**
 * App Router gives you raw body via req.text().
 * Verify the signature per Cybersource docs (adjust header names if needed).
 */
export async function POST(req: Request) {
  const raw = await req.text();
  // TODO: verify signature using CYBERSOURCE_SECRET_KEY and the exact signing scheme for SA notifications.
  // Placeholder: accept and mark succeeded for demo.
  const ok = true;

  // Ideally parse to get reference/orderId; for demo, simulate with a querystring parse if sent back.
  const orderId = /orderId=(ord_[A-Za-z0-9]+)/.exec(raw)?.[1] || 'ord_demo';

  if (ok) {
    await markOrderSucceededMock(orderId);
    return NextResponse.json({ received: true });
  }
  return NextResponse.json({ error: 'signature invalid' }, { status: 400 });
}
