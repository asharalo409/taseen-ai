import { createClient } from '@supabase/supabase-js';

// Browser client. Uses only the PUBLIC url + anon key. Protected by RLS.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
