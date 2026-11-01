import { supabaseAdmin } from './supabaseAdmin';

// Verifies the Bearer token AND that the user is the configured owner.
// Returns the user object, or null if the request is not allowed.
export async function requireUser(request) {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;

  const { data, error } = await supabaseAdmin().auth.getUser(token);
  if (error || !data || !data.user) return null;

  const owner = (process.env.OWNER_EMAIL || '').trim().toLowerCase();
  const email = (data.user.email || '').toLowerCase();
  if (!owner || email !== owner) return null;

  return data.user;
}
