import { getSupabase } from './supabaseClient.js';

function normalizeRow(row) {
  return { text: row.text || '', done: !!row.done, todoId: row.todo_id || null };
}

function scopeFilter(query, scope) {
  if (!scope || !scope.type || !scope.id) return query;
  return query.eq('owner_type', scope.type).eq('owner_id', scope.id);
}

export async function fetchPlannerRange(startKey, days, scope) {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const start = new Date(startKey + 'T00:00:00');
    const end = new Date(start);
    end.setDate(end.getDate() + Number(days) - 1);
    const startIso = start.toISOString().slice(0, 10);
    const endIso = end.toISOString().slice(0, 10);
    let query = supabase
      .from('planner_slots')
      .select('*')
      .gte('day', startIso)
      .lte('day', endIso);
    query = scopeFilter(query, scope);
    const { data, error } = await query
      .order('day', { ascending: true })
      .order('hour', { ascending: true });
    if (error) return null;
    const map = {};
    for (const r of data) {
      const k = r.day; // already YYYY-MM-DD
      if (!map[k]) map[k] = {};
      map[k][r.hour] = normalizeRow(r);
    }
    return map;
  } catch {
    return null;
  }
}

export async function upsertSlot(dayKey, hour, values, scope) {
  const supabase = getSupabase();
  if (!supabase) return;
  const payload = {
    day: dayKey,
    hour,
    text: values.text || '',
    done: !!values.done,
    todo_id: values.todoId || null,
    owner_type: scope?.type || null,
    owner_id: scope?.id || null,
  };
  await supabase.from('planner_slots').upsert(payload, { onConflict: 'day,hour,owner_type,owner_id' });
}

export async function deleteSlot(dayKey, hour, scope) {
  const supabase = getSupabase();
  if (!supabase) return;
  let q = supabase.from('planner_slots').delete().eq('day', dayKey).eq('hour', hour);
  if (scope && scope.type && scope.id) { q = q.eq('owner_type', scope.type).eq('owner_id', scope.id); }
  await q;
}

export function subscribePlanner(onChange, scope) {
  const supabase = getSupabase();
  if (!supabase) return () => {};
  const filter = scope && scope.type && scope.id ? `owner_type=eq.${scope.type},owner_id=eq.${scope.id}` : undefined;
  const channel = supabase
    .channel('planner-slots')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'planner_slots', filter },
      (payload) => { onChange(payload); }
    )
    .subscribe();
  return () => {
    try { supabase.removeChannel(channel); } catch {}
  };
}
