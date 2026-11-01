import { supabaseAdmin } from './supabaseAdmin';

// Runs an approved action. Only called AFTER the owner approved it.
// Add new action types here in the future (each one must be reviewed carefully).
export async function executeAction(userId, approval) {
  if (approval.action_type === 'save_memory') {
    const payload = approval.payload || {};
    const text = typeof payload.text === 'string' ? payload.text.trim() : '';
    if (!text || text.length > 500) throw new Error('Invalid memory text');
    const { error } = await supabaseAdmin()
      .from('memories')
      .insert({ user_id: userId, content: text });
    if (error) throw new Error('Could not save memory');
    return;
  }
  throw new Error('Unknown action type');
}
