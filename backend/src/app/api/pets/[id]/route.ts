// src/app/api/pets/[id]/route.ts
import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = getSupabaseServer()
  const { data, error } = await supabase.from('pets').select('id,state,owner_id').eq('id', params.id).single()
  if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ id: data.id, state: data.state, ownerId: data.owner_id })
}
