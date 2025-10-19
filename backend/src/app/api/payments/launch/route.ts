import { buildHostedCheckoutPayload } from '@/lib/cybersource';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId') || 'missing';
  // For demo: rebuild minimal payload here by orderId and fixed amount.
  // In production, look up order + amount in DB and sign once.
  const payload = buildHostedCheckoutPayload({
    amount: '1.99',
    currency: 'USD',
    reference: orderId,
    orderId,
  });

  const inputs = Object.entries(payload.fields)
    .map(([k, v]) => `<input type="hidden" name="${k}" value="${v}"/>`)
    .join('\n');

  const html = `<!doctype html>
<html><body onload="document.forms[0].submit()">
  <form method="post" action="${payload.formActionUrl}">
    ${inputs}
    <noscript><button type="submit">Continue to payment</button></noscript>
  </form>
</body></html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}
