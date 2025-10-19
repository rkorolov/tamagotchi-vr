// src/app/api/dev/env/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const hasService =
    !!process.env.SUPABASE_SERVICE_ROLE || !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  return new Response(
    JSON.stringify({
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
      hasServiceRole: hasService,
      // don’t print the key value; just whether it exists
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}
