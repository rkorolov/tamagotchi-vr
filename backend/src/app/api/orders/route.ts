// src/app/api/orders/route.ts
import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabaseServer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = getSupabaseServer()
  const body = await _req.json().catch(() => null) as { petId?: string, action?: 'heal'|'revive'|'buy' }
  if (!body?.petId || !body?.action) return NextResponse.json({ error: 'Bad Request' }, { status: 400 })

  // Basic pricing (match what you already used in /payments/launch)
  const price = body.action === 'revive' ? '3.99' : body.action === 'heal' ? '1.99' : '2.99'

  // Optional: authZ checks (is owner? is listing open? etc.)

  const { data, error } = await supabase.from('orders').insert({
    pet_id: body.petId,
    action: body.action,
    status: 'pending',
    amount: price,
  }).select('id,status,pet_id,action').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ orderId: data.id, status: data.status })
}
