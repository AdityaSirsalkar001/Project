import { getSupabase } from './supabaseClient.js';

function normalizeRow(row) {
  return { text: row.text || '', done: !!row.done, todoId: row.todo_id || null };
}

export async function fetchPlannerRange(startKey, days) {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const start = new Date(startKey + 'T00:00:00');
    const end = new Date(start);
    end.setDate(end.getDate() + Number(days) - 1);
    const startIso = start.toISOString().slice(0, 10);
    const endIso = end.toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('planner_slots')
      .select('*')
      .gte('day', startIso)
      .lte('day', endIso)
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

export async function upsertSlot(dayKey, hour, values) {
  const supabase = getSupabase();
  if (!supabase) return;
  const payload = {
    day: dayKey,
    hour,
    text: values.text || '',
    done: !!values.done,
    todo_id: values.todoId || null,
  };
  await supabase.from('planner_slots').upsert(payload, { onConflict: 'day,hour' });
}

export async function deleteSlot(dayKey, hour) {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from('planner_slots').delete().eq('day', dayKey).eq('hour', hour);
}

export function subscribePlanner(onChange) {
  const supabase = getSupabase();
  if (!supabase) return () => {};
  const channel = supabase
    .channel('planner-slots')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'planner_slots' },
      (payload) => {
        onChange(payload);
      }
    )
    .subscribe();
  return () => {
    try { supabase.removeChannel(channel); } catch {}
  };
}
