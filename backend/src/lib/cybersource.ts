import crypto from 'crypto';

const env = process.env as Record<string, string | undefined>;

const {
  CYBERSOURCE_PROFILE_ID,
  CYBERSOURCE_ACCESS_KEY,
  CYBERSOURCE_SECRET_KEY,
  CYBERSOURCE_CHECKOUT_URL,
  BASE_URL,
} = env;

export function requireCybersourceEnv(): void {
  const missing = [
    'CYBERSOURCE_PROFILE_ID',
    'CYBERSOURCE_ACCESS_KEY',
    'CYBERSOURCE_SECRET_KEY',
    'CYBERSOURCE_CHECKOUT_URL',
    'BASE_URL',
  ].filter((k) => !env[k]);
  if (missing.length) {
    throw new Error(`Missing env: ${missing.join(', ')}`);
  }
}

function hmacSha256Base64(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data, 'utf8').digest('base64');
}

/**
 * Build signed fields for Secure Acceptance Hosted Checkout.
 * NOTE: We don't use merchant id for HCO signing; profile/access/secret are sufficient.
 */
export function buildHostedCheckoutPayload(opts: {
  amount: string;     // e.g., "1.99"
  currency: string;   // e.g., "USD"
  reference: string;  // unique per order
  orderId: string;
}) {
  requireCybersourceEnv();

  const access_key = CYBERSOURCE_ACCESS_KEY as string;
  const profile_id = CYBERSOURCE_PROFILE_ID as string;
  const transaction_type = 'sale';
  const signed_date_time = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'); // strip ms
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

  const unsigned_field_names = '';

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
    orderId: opts.orderId,
  };

  const dataToSign = signed_field_names
    .split(',')
    .map((name: string) => `${name}=${fields[name]}`)
    .join(',');

  const signature = hmacSha256Base64(dataToSign, CYBERSOURCE_SECRET_KEY as string);

  return {
    formActionUrl: CYBERSOURCE_CHECKOUT_URL as string,
    fields: { ...fields, signature },
  };
}
