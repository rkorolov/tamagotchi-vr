import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> } // 👈 params is a Promise
) {
  const { id } = await context.params;          // 👈 await it

  // TODO: replace with Supabase fetch
  const pet = { id, name: 'Pet', species: 'cat', state: 'healthy' };
  return NextResponse.json({ pet });
}
