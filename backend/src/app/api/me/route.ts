import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: read from Supabase
  return NextResponse.json({
    user: { id: 'u1', email: 'alice@demo' },
    pets: [
      { id: 'p1', name: 'Zuzu', species: 'dog', state: 'sick' },
      { id: 'p2', name: 'Blinky', species: 'blob', state: 'dead' },
      { id: 'p3', name: 'Mochi', species: 'cat', state: 'healthy' },
    ],
    myListings: [],
  });
}
