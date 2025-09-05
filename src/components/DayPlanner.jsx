import React, { useEffect, useState } from 'react';
import { usePersistentState } from '../lib/hooks.js';
import { getSupabase } from '../lib/supabaseClient.js';
import { fetchPlannerRange, upsertSlot as upsertSlotServer, deleteSlot as deleteSlotServer, subscribePlanner } from '../lib/plannerApi.js';
import { useAuth } from '../lib/AuthProvider.jsx';
import { getMyGroups, createGroup, createInvite, acceptInvite } from '../lib/collabApi.js';

function hoursRange(start = 6, end = 22) {
  const arr = [];
  for (let h = start; h <= end; h++) arr.push(h);
  return arr;
}

function dateKeyLocal(d = new Date()) { const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; }
function fmtDateInput(k) { return k; }

function addDays(d, delta) { const nd = new Date(d + 'T00:00:00'); nd.setDate(nd.getDate() + delta); return nd; }
function labelFor(key) { const d = new Date(key + 'T00:00:00'); return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }); }

export default function DayPlanner() {
  const { user } = useAuth();
  const [myPlanner, setMyPlanner] = usePersistentState('planner', {});
  const [groupPlanner, setGroupPlanner] = useState({});
  const [selected, setSelected] = usePersistentState('planner:date', dateKeyLocal());
  const [days, setDays] = usePersistentState('planner:span', 5);
  const [todos, setTodos] = usePersistentState('todos', []);
  const [groups, setGroups] = useState([]);
  const [groupId, setGroupId] = useState('');
  const [inviteInput, setInviteInput] = useState('');
  const supabase = getSupabase();
  const useCloud = !!supabase;

  function getDaySlots(map, dayKey) { return map[dayKey] || {}; }
  function slotFor(map, dayKey, hour) {
    const v = getDaySlots(map, dayKey)[hour];
    if (typeof v === 'string') return { text: v, done: false, todoId: null };
    return { text: v?.text || '', done: !!v?.done, todoId: v?.todoId || null };
  }

  function createLinkedTodo(setMap, map, dayKey, hour, text, done) {
    const now = Date.now();
    const todo = { id: crypto.randomUUID(), text, done: !!done, createdAt: now, updatedAt: now, project: 'Planner', tags: [] };
    setTodos([todo, ...todos]);
    const nextDay = { ...getDaySlots(map, dayKey), [hour]: { text, done: !!done, todoId: todo.id } };
    setMap({ ...map, [dayKey]: nextDay });
    return todo.id;
  }

  function setSlotGeneric(setMap, map, scope, dayKey, hour, text) {
    const prev = slotFor(map, dayKey, hour);
    const nextDay = { ...getDaySlots(map, dayKey), [hour]: { text, done: prev.done, todoId: prev.todoId || null } };
    setMap({ ...map, [dayKey]: nextDay });
    if (useCloud && scope) {
      upsertSlotServer(dayKey, hour, { text, done: prev.done, todoId: prev.todoId || null }, scope);
    }
    const t = text.trim();
    if (t && prev.todoId) {
      setTodos(todos.map(td => td.id === prev.todoId ? { ...td, text: t, updatedAt: Date.now() } : td));
    }
  }

  function setDoneGeneric(setMap, map, scope, dayKey, hour, done) {
    const prev = slotFor(map, dayKey, hour);
    const nextDay = { ...getDaySlots(map, dayKey), [hour]: { text: prev.text, done, todoId: prev.todoId || null } };
    setMap({ ...map, [dayKey]: nextDay });
    if (useCloud && scope) {
      upsertSlotServer(dayKey, hour, { text: prev.text, done, todoId: prev.todoId || null }, scope);
    }
    if (prev.todoId) {
      setTodos(todos.map(td => td.id === prev.todoId ? { ...td, done, updatedAt: Date.now() } : td));
    } else if (prev.text && prev.text.trim()) {
      const id = createLinkedTodo(setMap, map, dayKey, hour, prev.text.trim(), done);
      setTodos(todos.map(td => td.id === id ? { ...td, done } : td));
    }
  }

  function changeDate(deltaDays) {
    const d = new Date(selected + 'T00:00:00');
    d.setDate(d.getDate() + deltaDays);
    setSelected(dateKeyLocal(d));
  }

  function onDateChange(e) { setSelected(e.target.value); }

  // Load groups for current user
  useEffect(() => {
    if (!useCloud || !user?.id) return;
    (async () => {
      const gs = await getMyGroups();
      setGroups(gs);
      if (!groupId && gs.length) setGroupId(gs[0].id);
    })();
  }, [useCloud, user?.id]);

  async function onCreateGroup() {
    const name = prompt('Group name');
    if (!name) return;
    const g = await createGroup(name);
    if (g) { const gs = await getMyGroups(); setGroups(gs); setGroupId(g.id); }
  }

  async function onInviteLink() {
    if (!groupId) return;
    const token = await createInvite(groupId);
    if (token) {
      const url = `${window.location.origin}#invite=${token}`;
      try { await navigator.clipboard.writeText(url); alert('Invite link copied to clipboard'); } catch { alert(url); }
    }
  }

  async function onAcceptInvite() {
    const token = inviteInput.trim();
    if (!token) return;
    const res = await acceptInvite(token);
    if (res.ok) {
      const gs = await getMyGroups(); setGroups(gs);
      setGroupId(res.group_id);
      setInviteInput('');
    } else {
      alert('Invalid or expired invite');
    }
  }

  const dayKeys = Array.from({ length: Number(days) }, (_, i) => dateKeyLocal(addDays(selected, i)));
  const [editing, setEditing] = useState(null);

  // Load my planner (user scope)
  useEffect(() => {
    if (!useCloud || !user?.id) return;
    let mounted = true;
    (async () => {
      const data = await fetchPlannerRange(selected, days, { type: 'user', id: user.id });
      if (mounted && data) setMyPlanner(prev => ({ ...prev, ...data }));
    })();
    return () => { mounted = false; };
  }, [useCloud, user?.id, selected, days]);

  // Load group planner (group scope)
  useEffect(() => {
    if (!useCloud || !groupId) return;
    let mounted = true;
    (async () => {
      const data = await fetchPlannerRange(selected, days, { type: 'group', id: groupId });
      if (mounted && data) setGroupPlanner(prev => ({ ...prev, ...data }));
    })();
    return () => { mounted = false; };
  }, [useCloud, groupId, selected, days]);
  function addTodoFromSlotGeneric(setMap, map, dayKey, hour) {
    const slot = slotFor(map, dayKey, hour);
    const t = slot.text.trim();
    if (!t) return;
    if (slot.todoId) return;
    createLinkedTodo(setMap, map, dayKey, hour, t, slot.done);
  }
  function deleteLinkedTodoGeneric(setMap, map, scope, dayKey, hour) {
    const slot = slotFor(map, dayKey, hour);
    if (!slot.todoId) return;
    setTodos(todos.filter(td => td.id !== slot.todoId));
    const day = { ...getDaySlots(map, dayKey) };
    delete day[hour];
    setMap({ ...map, [dayKey]: day });
    if (useCloud && scope) {
      deleteSlotServer(dayKey, hour, scope);
    }
  }

  // Realtime for my planner
  useEffect(() => {
    if (!useCloud || !user?.id) return;
    const unsub = subscribePlanner((payload) => {
      const row = payload.new || payload.old;
      const dayKey = row?.day; const hour = row?.hour;
      if (!dayKey || hour == null) return;
      setMyPlanner(prev => {
        const next = { ...prev }; const day = { ...(next[dayKey] || {}) };
        if (payload.eventType === 'DELETE') delete day[hour]; else day[hour] = { text: row.text || '', done: !!row.done, todoId: row.todo_id || null };
        next[dayKey] = day; return next;
      });
    }, { type: 'user', id: user.id });
    return () => unsub && unsub();
  }, [useCloud, user?.id]);

  // Realtime for group planner
  useEffect(() => {
    if (!useCloud || !groupId) return;
    const unsub = subscribePlanner((payload) => {
      const row = payload.new || payload.old;
      const dayKey = row?.day; const hour = row?.hour;
      if (!dayKey || hour == null) return;
      setGroupPlanner(prev => {
        const next = { ...prev }; const day = { ...(next[dayKey] || {}) };
        if (payload.eventType === 'DELETE') delete day[hour]; else day[hour] = { text: row.text || '', done: !!row.done, todoId: row.todo_id || null };
        next[dayKey] = day; return next;
      });
    }, { type: 'group', id: groupId });
    return () => unsub && unsub();
  }, [useCloud, groupId]);

  return (
    <div className="section">
      <div className="panel">
        <h3 className="panel-title">My Planner</h3>
        <div className="planner-toolbar row wrap">
          <button className="btn secondary" onClick={() => changeDate(-Number(days))}>Previous</button>
          <button className="btn secondary" onClick={() => setSelected(dateKeyLocal())}>Today</button>
          <button className="btn secondary" onClick={() => changeDate(Number(days))}>Next</button>
          <input className="input date-input" type="date" value={fmtDateInput(selected)} onChange={onDateChange} />
          <select className="select days-span-select" value={days} onChange={e => setDays(Number(e.target.value))}>
            <option value={3}>3 days</option>
            <option value={5}>5 days</option>
            <option value={7}>7 days</option>
          </select>
        </div>

        <div className="planner-matrix-wrapper">
          <div className={`planner-matrix days-${days}`}>
            <div className="planner-matrix-header">
              <div className="planner-time"></div>
              {dayKeys.map(k => (
                <div className="planner-day-label" key={k}>{labelFor(k)}</div>
              ))}
            </div>
            {hoursRange().map(h => (
              <div className="planner-matrix-row" key={h}>
                <div className="planner-time">{String(h).padStart(2, '0')}:00</div>
                {dayKeys.map(k => {
                  const slot = slotFor(myPlanner, k, h);
                  const key = 'me|' + k + '|' + h;
                  const showAdd = editing === key && slot.text.trim() && !slot.todoId;
                  const showDelete = editing === key && !!slot.todoId;
                  const scope = useCloud && user?.id ? { type: 'user', id: user.id } : null;
                  return (
                    <div key={'me-' + k + '-' + h} className={`planner-slot ${slot.done ? 'planner-done' : ''} ${slot.todoId ? 'has-task' : ''} ${editing === key ? 'slot-editing' : ''}`}>
                      <input className="planner-checkbox" type="checkbox" checked={slot.done} onChange={e => setDoneGeneric(setMyPlanner, myPlanner, scope, k, h, e.target.checked)} />
                      <textarea className="planner-cell" value={slot.text} onChange={e => setSlotGeneric(setMyPlanner, myPlanner, scope, k, h, e.target.value)} onFocus={() => setEditing(key)} onBlur={() => setTimeout(() => { setEditing(curr => curr === key ? null : curr); }, 120)} />
                      {showAdd && (
                        <button className="btn success small planner-add-btn" onMouseDown={e => e.preventDefault()} onClick={() => addTodoFromSlotGeneric(setMyPlanner, myPlanner, k, h)}>Add</button>
                      )}
                      {showDelete && (
                        <button className="btn danger small planner-del-btn" onMouseDown={e => e.preventDefault()} onClick={() => deleteLinkedTodoGeneric(setMyPlanner, myPlanner, scope, k, h)}>Delete</button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="row between wrap" style={{ marginBottom: 12 }}>
          <h3 className="panel-title">Shared Planner</h3>
          <div className="row wrap" style={{ gap: 8 }}>
            <select className="select" value={groupId} onChange={e => setGroupId(e.target.value)} style={{ minWidth: 160 }}>
              <option value="">Select group</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <button className="btn secondary" onClick={onCreateGroup}>Create group</button>
            <button className="btn secondary" onClick={onInviteLink} disabled={!groupId}>Invite link</button>
            <input className="input" placeholder="Paste invite token" value={inviteInput} onChange={e => setInviteInput(e.target.value)} style={{ maxWidth: 220 }} />
            <button className="btn" onClick={onAcceptInvite}>Join</button>
          </div>
        </div>

        {!groupId ? (
          <div className="small">Select or create a group to view its shared schedule.</div>
        ) : (
          <div className="planner-matrix-wrapper">
            <div className={`planner-matrix days-${days}`}>
              <div className="planner-matrix-header">
                <div className="planner-time"></div>
                {dayKeys.map(k => (
                  <div className="planner-day-label" key={k}>{labelFor(k)}</div>
                ))}
              </div>
              {hoursRange().map(h => (
                <div className="planner-matrix-row" key={h}>
                  <div className="planner-time">{String(h).padStart(2, '0')}:00</div>
                  {dayKeys.map(k => {
                    const slot = slotFor(groupPlanner, k, h);
                    const key = 'grp|' + k + '|' + h;
                    const showAdd = editing === key && slot.text.trim() && !slot.todoId;
                    const showDelete = editing === key && !!slot.todoId;
                    const scope = useCloud && groupId ? { type: 'group', id: groupId } : null;
                    return (
                      <div key={'grp-' + k + '-' + h} className={`planner-slot ${slot.done ? 'planner-done' : ''} ${slot.todoId ? 'has-task' : ''} ${editing === key ? 'slot-editing' : ''}`}>
                        <input className="planner-checkbox" type="checkbox" checked={slot.done} onChange={e => setDoneGeneric(setGroupPlanner, groupPlanner, scope, k, h, e.target.checked)} />
                        <textarea className="planner-cell" value={slot.text} onChange={e => setSlotGeneric(setGroupPlanner, groupPlanner, scope, k, h, e.target.value)} onFocus={() => setEditing(key)} onBlur={() => setTimeout(() => { setEditing(curr => curr === key ? null : curr); }, 120)} />
                        {showAdd && (
                          <button className="btn success small planner-add-btn" onMouseDown={e => e.preventDefault()} onClick={() => addTodoFromSlotGeneric(setGroupPlanner, groupPlanner, k, h)}>Add</button>
                        )}
                        {showDelete && (
                          <button className="btn danger small planner-del-btn" onMouseDown={e => e.preventDefault()} onClick={() => deleteLinkedTodoGeneric(setGroupPlanner, groupPlanner, scope, k, h)}>Delete</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
