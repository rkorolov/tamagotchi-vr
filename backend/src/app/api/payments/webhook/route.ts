// src/app/api/payments/webhook/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual } from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

type Fields = Record<string, string>

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only
  return createClient(url, key, { auth: { persistSession: false } })
}

function parseFormEncoded(body: string): Fields {
  const params = new URLSearchParams(body)
  const out: Fields = {}
  params.forEach((v, k) => { out[k] = v })
  return out
}

/**
 * CyberSource Secure Acceptance (Hosted Checkout) signature verification:
 * - fields["signed_field_names"] is a comma-delimited list of keys that were signed
 * - You must build a string: "k1=v1,k2=v2,..." in that exact order
 * - HMAC-SHA256 over that string with your secret, Base64-encode → compare to fields["signature"]
 */
function verifyCyberSourceSignature(fields: Fields, secret: string): boolean {
  const sfn = fields['signed_field_names']
  const sig = fields['signature']
  if (!sfn || !sig) return false

  const message = sfn
    .split(',')
    .map((k) => `${k}=${fields[k] ?? ''}`)
    .join(',')

  const expected = createHmac('sha256', secret).update(message, 'utf8').digest('base64')

  // constant-time compare
  try {
    const a = Buffer.from(expected)
    const b = Buffer.from(sig)
    return a.length === b.length && timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export async function POST(req: Request) {
  // 1) Read raw body FIRST (needed for HMAC schemes; we verify from fields per CyberSource)
  const raw = await req.text()
  const fields = parseFormEncoded(raw)

  // 2) Verify signature
  const secret = process.env.CYBERSOURCE_SECRET_KEY
  if (!secret || !verifyCyberSourceSignature(fields, secret)) {
    return new NextResponse('Invalid signature', { status: 400 })
  }

  // 3) Pull essentials
  const orderId = fields['orderId'] || fields['req_reference_number'] // adapt if you used a different param
  const decision = fields['decision'] // e.g., ACCEPT / CANCEL / DECLINE
  const eventId = fields['transaction_id'] || fields['req_transaction_uuid'] || crypto.randomUUID()

  if (!orderId) {
    return NextResponse.json({ error: 'missing orderId' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  // 4) Idempotency: skip if we’ve already processed this event
  const { data: seen, error: seenErr } = await supabase
    .from('processed_events')
    .select('id')
    .eq('id', eventId)
    .maybeSingle()

  if (seenErr) return NextResponse.json({ error: seenErr.message }, { status: 500 })
  if (seen) return NextResponse.json({ ok: true })

  try {
    if (decision === 'ACCEPT') {
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .select('id, pet_id, action, status')
        .eq('id', orderId)
        .single()

      if (orderErr) throw orderErr

      if (order && order.status === 'pending') {
        if (order.action === 'heal' || order.action === 'revive') {
          await supabase.from('pets').update({ state: 'healthy' }).eq('id', order.pet_id)
        }
        // TODO: handle 'buy' → transfer ownership & close listing
        await supabase.from('orders').update({ status: 'succeeded' }).eq('id', orderId)
      }
    } else {
      await supabase
        .from('orders')
        .update({ status: decision === 'CANCEL' ? 'canceled' : 'failed' })
        .eq('id', orderId)
    }

    // 5) Record the processed event (idempotency)
    await supabase.from('processed_events').insert({
      id: eventId,
      type: 'cybersource',
      order_id: orderId,
      decision,
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    // Returning 5xx prompts most PSPs to retry
    return new NextResponse(`Webhook handling failed: ${e.message}`, { status: 500 })
  }
}