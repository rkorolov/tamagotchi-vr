import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createOrderMock, validateAction } from '@/lib/orderService';
import type { OrderCreateRequest } from '@/types/dto';

export async function POST(req: NextRequest) {
  const body = (await req.json()) as OrderCreateRequest;

  try {
    // Validate the requested action against current pet state
    await validateAction(body);

    // TODO: replace with real authenticated user id
    const userId = 'u1';

    // 1) Create order in DB (status = pending)
    const order = await createOrderMock(userId, body.petId, body.action);

    // 2) Return a clean launch URL Unity can open
    // (The launch route will read the order/action and build the signed form)
    const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
    const launchUrl = `${baseUrl}/api/payments/launch?orderId=${encodeURIComponent(order.id)}`;

    return NextResponse.json({ checkoutUrl: launchUrl, orderId: order.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to create order';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
