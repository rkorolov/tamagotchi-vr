// src/app/api/orders/[id]/route.ts
import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabaseServer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = getSupabaseServer()
  const { data, error } = await supabase
    .from('orders')
    .select('id,status,action,pet_id')
    .eq('id', params.id)
    .single()
  if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ id: data.id, status: data.status, action: data.action, petId: data.pet_id })
}
