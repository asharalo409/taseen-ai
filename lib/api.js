import { supabase } from './supabaseClient';

// fetch() that automatically sends the logged-in user's token. Browser only.
export async function authFetch(url, options = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session ? data.session.access_token : '';
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
}
