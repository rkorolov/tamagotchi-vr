import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: fetch from Supabase
  return NextResponse.json({ listings: [] });
}

export async function POST() {
  // TODO: insert listing
  return NextResponse.json({ listing: { id: 'l1' } }, { status: 201 });
}
