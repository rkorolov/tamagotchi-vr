import { NextResponse } from 'next/server';
import { buildHostedCheckoutPayload } from '@/lib/cybersource';
import { createOrderMock, validateAction } from '@/lib/orderService';
import type { OrderCreateRequest } from '@/types/dto';

export async function POST(req: Request) {
  const body = (await req.json()) as OrderCreateRequest;
  try {
    await validateAction(body);

    // TODO: replace with real authenticated user
    const userId = 'u1';

    // 1) Create order (DB pending)
    const order = await createOrderMock(userId, body.petId, body.action);

    // 2) Build signed payload for Cybersource Hosted Checkout
    const amount = body.action === 'revive' ? '3.99' : body.action === 'heal' ? '1.99' : '2.99';
    const payload = buildHostedCheckoutPayload({
      amount,
      currency: 'USD',
      reference: order.id,
      orderId: order.id,
    });

    // 3) We’ll return a launch URL that auto-POSTs fields to Cybersource
    const launchUrl = `${process.env.BASE_URL}/api/payments/launch?orderId=${order.id}`;

    // Store fields server-side (cache/kv/db) for the launch route to render.
    // For demo simplicity, include in-memory alternative via query (or replace with a KV)
    // In production, DO NOT send secrets to the client.

    // Return clean URL Unity can open
    return NextResponse.json({ checkoutUrl: launchUrl, orderId: order.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to create order' }, { status: 400 });
  }
}
