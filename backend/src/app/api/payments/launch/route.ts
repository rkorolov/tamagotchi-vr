// src/app/api/payments/launch/route.ts
import { buildHostedCheckoutPayload } from '@/lib/cybersource';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId')!;
  const { data: order } = await supabase.from('orders')
    .select('id,action')
    .eq('id', orderId)
    .single();
  if (!order) return new Response('Order not found', { status: 404 });

  const amount = order.action === 'revive' ? '3.99' : order.action === 'heal' ? '1.99' : '2.99';

  const payload = buildHostedCheckoutPayload({
    amount, currency: 'USD', reference: order.id, orderId: order.id
  });

  const inputs = Object.entries(payload.fields)
    .map(([k, v]) => `<input type="hidden" name="${k}" value="${v}"/>`)
    .join('');

  const html = `<!doctype html><html><body onload="document.forms[0].submit()">
    <form method="post" action="${payload.formActionUrl}">
      ${inputs}
      <noscript><button type="submit">Continue to payment</button></noscript>
    </form>
  </body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}
