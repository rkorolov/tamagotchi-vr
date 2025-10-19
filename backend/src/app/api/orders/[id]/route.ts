import { NextResponse } from 'next/server';
import { getOrderMock } from '@/lib/orderService';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const order = await getOrderMock(params.id);
  if (!order) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ status: order.status });
}
