export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function GET() {
  const sb = getSupabaseServer();
  const { data, error } = await sb.from('pets').select('id, name, state').limit(5);
  return NextResponse.json({ url: process.env.NEXT_PUBLIC_SUPABASE_URL, count: data?.length ?? 0, data, error });
}