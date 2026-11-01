import { createClient } from '@supabase/supabase-js';

let client = null;

// SERVER ONLY. Never import this file from a client component.
export function supabaseAdmin() {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }
  return client;
}
