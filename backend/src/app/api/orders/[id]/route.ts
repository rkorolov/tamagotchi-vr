import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getOrderMock } from '@/lib/orderService';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }   // 👈 params is a Promise
) {
  const { id } = await context.params;           // 👈 await it
  const order = await getOrderMock(id);
  if (!order) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ status: order.status });
}
