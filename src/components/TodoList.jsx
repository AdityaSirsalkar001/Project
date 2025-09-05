import React, { useEffect, useMemo, useState } from 'react';
import { usePersistentState } from '../lib/hooks.js';
import { playTone } from '../lib/sound.js';

function nextDue(date, recurring) {
  const d = new Date(date);
  if (recurring === 'daily') d.setDate(d.getDate() + 1);
  if (recurring === 'weekly') d.setDate(d.getDate() + 7);
  if (recurring === 'monthly') d.setMonth(d.getMonth() + 1);
  return d.getTime();
}

export default function TodoList() {
  const [items, setItems] = usePersistentState('todos', []);
  const [text, setText] = useState('');
  const [filter, setFilter] = useState('all');
  const [project, setProject] = usePersistentState('todos:project', 'all');
  const [tagsFilter, setTagsFilter] = useState('');

  const [celebrate, setCelebrate] = useState(false);
  const [pulseId, setPulseId] = useState(null);
  const [toast, setToast] = useState(false);

  function addItem() {
    const t = text.trim();
    if (!t) return;
    const now = Date.now();
    setItems([{ id: crypto.randomUUID(), text: t, done: false, createdAt: now, updatedAt: now, project: 'General', tags: [] }, ...items]);
    setText('');
  }

  function triggerCelebrate() {
    try {
      playTone({ freq: 880, duration: 110, type: 'triangle' });
      setTimeout(() => playTone({ freq: 1318.5, duration: 130, type: 'triangle' }), 120);
      setTimeout(() => playTone({ freq: 1760, duration: 140, type: 'triangle' }), 260);
    } catch {}
    setCelebrate(true);
    setToast(true);
    setTimeout(() => setCelebrate(false), 900);
    setTimeout(() => setToast(false), 1200);
  }

  function toggle(id) {
    const target = items.find(i => i.id === id);
    const willBeDone = target ? !target.done : false;
    setItems(items.map(i => {
      if (i.id !== id) return i;
      const done = !i.done;
      const updated = { ...i, done, updatedAt: Date.now() };
      if (done && i.recurring && i.recurring !== 'none' && i.dueAt) {
        const next = { ...i, id: crypto.randomUUID(), done: false, createdAt: Date.now(), updatedAt: Date.now(), dueAt: nextDue(i.dueAt, i.recurring) };
        return [updated, next];
      }
      return updated;
    }).flat());
    if (willBeDone) {
      setPulseId(id);
      triggerCelebrate();
      setTimeout(() => setPulseId(null), 800);
    }
  }
  function remove(id) { setItems(items.filter(i => i.id !== id)); }
  function edit(id, value) { setItems(items.map(i => i.id === id ? { ...i, text: value, updatedAt: Date.now() } : i)); }
  function setItem(id, patch) { setItems(items.map(i => i.id === id ? { ...i, ...patch, updatedAt: Date.now() } : i)); }
  function clearCompleted() { setItems(items.filter(i => !i.done)); }

  const projects = useMemo(() => ['all', 'General', ...Array.from(new Set(items.map(i => i.project).filter(Boolean)))], [items]);

  // Reminders (left as-is for legacy tasks that may still have due times set elsewhere)
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      items.forEach(i => {
        if (!i.done && i.dueAt && i.dueAt <= now) {
          playTone({ freq: 880, duration: 180, type: 'triangle' });
        }
      });
    }, 30000);
    return () => clearInterval(id);
  }, [items]);

  const shown = useMemo(() => {
    let list = items;
    if (filter === 'active') list = list.filter(i => !i.done);
    if (filter === 'done') list = list.filter(i => i.done);
    if (project !== 'all') list = list.filter(i => i.project === project);
    const tags = tagsFilter.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    if (tags.length) list = list.filter(i => (i.tags||[]).some(t => tags.includes(t.toLowerCase())));
    return list;
  }, [items, filter, project, tagsFilter]);

  return (
    <div className="panel">
      <h3 className="panel-title">Tasks</h3>
      <div className="row filters-row">
        <input className="input task-add-input" placeholder="Add a task" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addItem(); }} />
        <button className="btn" onClick={addItem}>Add</button>
        <select className="select status-filter" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="done">Completed</option>
        </select>
        <select className="select project-filter" value={project} onChange={e => setProject(e.target.value)}>
          {projects.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <input className="input tags-filter" placeholder="Filter tags (comma)" value={tagsFilter} onChange={e => setTagsFilter(e.target.value)} />
        <button className="btn secondary" onClick={clearCompleted}>Clear Completed</button>
      </div>
      <ul className="list">
        {shown.map(item => (
          <li key={item.id} className={`list-item ${item.done ? 'task-done' : ''} ${pulseId === item.id ? 'task-complete-pulse' : ''}`}>
            <div className="item-left item-left-expand">
              <input type="checkbox" checked={item.done} onChange={() => toggle(item.id)} />
              <input className="input" value={item.text} onChange={e => edit(item.id, e.target.value)} />
            </div>
            <div className="item-actions">
              <input className="input project-input" placeholder="Project" value={item.project || ''} onChange={e => setItem(item.id, { project: e.target.value })} />
              <input className="input tags-input" placeholder="tags e.g. work,writing" value={(item.tags || []).join(', ')} onChange={e => setItem(item.id, { tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
              <button className="btn danger" onClick={() => remove(item.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
      {celebrate && <div className="complete-burst" aria-hidden="true" />}
      {toast && <div className="completion-toast">Great job! Task completed</div>}
    </div>
  );
}
