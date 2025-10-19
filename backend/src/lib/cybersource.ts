import crypto from 'crypto';

const {
  CYBERSOURCE_MERCHANT_ID,
  CYBERSOURCE_PROFILE_ID,
  CYBERSOURCE_ACCESS_KEY,
  CYBERSOURCE_SECRET_KEY,
  CYBERSOURCE_CHECKOUT_URL,
  BASE_URL,
} = process.env;

export function requireCybersourceEnv() {
  const missing = [
    'CYBERSOURCE_MERCHANT_ID',
    'CYBERSOURCE_PROFILE_ID',
    'CYBERSOURCE_ACCESS_KEY',
    'CYBERSOURCE_SECRET_KEY',
    'CYBERSOURCE_CHECKOUT_URL',
    'BASE_URL',
  ].filter((k) => !process.env[k]);
  if (missing.length) throw new Error(`Missing env: ${missing.join(', ')}`);
}

function hmacSha256Base64(data: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(data, 'utf8').digest('base64');
}

/**
 * Build signed fields for Secure Acceptance Hosted Checkout.
 * For now we return a minimal set; expand as needed.
 */
export function buildHostedCheckoutPayload(opts: {
  amount: string;        // e.g., "1.99"
  currency: string;      // e.g., "USD"
  reference: string;     // unique id per order
  orderId: string;
}) {
  requireCybersourceEnv();

  const access_key = CYBERSOURCE_ACCESS_KEY!;
  const profile_id = CYBERSOURCE_PROFILE_ID!;
  const transaction_type = 'sale';
  const signed_date_time = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'); // ISO8601 no ms
  const transaction_uuid = crypto.randomUUID();
  const locale = 'en-us';

  const override_custom_receipt_page = `${BASE_URL}/api/payments/callback`;
  const override_custom_cancel_page = `${BASE_URL}/api/payments/callback`;

  const signed_field_names = [
    'access_key',
    'profile_id',
    'transaction_uuid',
    'signed_field_names',
    'unsigned_field_names',
    'signed_date_time',
    'locale',
    'transaction_type',
    'reference_number',
    'amount',
    'currency',
    'override_custom_receipt_page',
    'override_custom_cancel_page',
    'orderId',
  ].join(',');

  const unsigned_field_names = ''; // keep empty for now

  const fields: Record<string, string> = {
    access_key,
    profile_id,
    transaction_uuid,
    signed_field_names,
    unsigned_field_names,
    signed_date_time,
    locale,
    transaction_type,
    reference_number: opts.reference,
    amount: opts.amount,
    currency: opts.currency,
    override_custom_receipt_page,
    override_custom_cancel_page,
    orderId: opts.orderId, // custom field we’ll see in webhook/callback
  };

  // Signature is HMAC over name=value pairs in signed_field_names order.
  const dataToSign = signed_field_names
    .split(',')
    .map((name) => `${name}=${fields[name]}`)
    .join(',');

  const signature = hmacSha256Base64(dataToSign, CYBERSOURCE_SECRET_KEY!);

  return {
    formActionUrl: CYBERSOURCE_CHECKOUT_URL!,
    fields: { ...fields, signature },
  };
}
