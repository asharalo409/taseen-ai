import { supabaseAdmin } from './supabaseAdmin';

// Writes an entry to the activity log. Never throws.
export async function logActivity(userId, event, details = {}) {
  try {
    const { error } = await supabaseAdmin()
      .from('activity_log')
      .insert({ user_id: userId, event, details });
    if (error) console.error('activity log failed:', error.message);
  } catch (e) {
    console.error('activity log failed');
  }
}
