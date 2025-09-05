import { getSupabase } from './supabaseClient.js';

export async function getCurrentUser() {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user || null;
}

export async function getMyGroups() {
  const supabase = getSupabase();
  if (!supabase) return [];
  const user = await getCurrentUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('group_members')
    .select('group_id, groups(id, name)')
    .eq('user_id', user.id);
  if (error) return [];
  return (data || []).map(r => ({ id: r.groups?.id || r.group_id, name: r.groups?.name || 'Group' }));
}

export async function createGroup(name) {
  const supabase = getSupabase();
  if (!supabase) return null;
  const user = await getCurrentUser();
  if (!user) return null;
  const { data: g, error } = await supabase.from('groups').insert({ name, owner_id: user.id }).select('*').single();
  if (error) return null;
  await supabase.from('group_members').insert({ group_id: g.id, user_id: user.id, role: 'owner' });
  return g;
}

export async function createInvite(groupId, ttlHours = 168) {
  const supabase = getSupabase();
  if (!supabase) return null;
  const user = await getCurrentUser();
  if (!user) return null;
  const expires = new Date(Date.now() + ttlHours * 3600 * 1000).toISOString();
  const token = crypto.randomUUID();
  const payload = { token, group_id: groupId, created_by: user.id, expires_at: expires };
  const { error } = await supabase.from('group_invites').insert(payload);
  if (error) return null;
  return token;
}

export async function acceptInvite(token) {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, reason: 'no_supabase' };
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: 'no_user' };
  const { data: inv, error } = await supabase
    .from('group_invites')
    .select('*')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .limit(1)
    .single();
  if (error || !inv) return { ok: false, reason: 'invalid_token' };
  await supabase.from('group_members').upsert({ group_id: inv.group_id, user_id: user.id, role: 'member' }, { onConflict: 'group_id,user_id' });
  return { ok: true, group_id: inv.group_id };
}
