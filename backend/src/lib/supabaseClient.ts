import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !service) {
  // Don’t crash in dev mocks; just warn
  console.warn('Supabase env not set. Using mock data until configured.');
}

export const supabaseAdmin = url && service
  ? createClient(url, service)
  : null;
