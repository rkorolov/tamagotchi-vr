import { NextResponse } from 'next/server';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  // TODO: fetch from Supabase
  const { id } = params;
  const pet = { id, name: 'Pet', species: 'cat', state: 'healthy' };
  return NextResponse.json({ pet });
}
