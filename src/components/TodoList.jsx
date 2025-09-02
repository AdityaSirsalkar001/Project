import React, { useMemo, useState } from 'react';
import { usePersistentState } from '../lib/hooks.js';

export default function TodoList() {
  const [items, setItems] = usePersistentState('todos', []);
  const [text, setText] = useState('');
  const [filter, setFilter] = useState('all');

  function addItem() {
    const t = text.trim();
    if (!t) return;
    const now = Date.now();
    setItems([{ id: crypto.randomUUID(), text: t, done: false, createdAt: now, updatedAt: now }, ...items]);
    setText('');
  }

  function toggle(id) { setItems(items.map(i => i.id === id ? { ...i, done: !i.done, updatedAt: Date.now() } : i)); }
  function remove(id) { setItems(items.filter(i => i.id !== id)); }
  function edit(id, value) { setItems(items.map(i => i.id === id ? { ...i, text: value, updatedAt: Date.now() } : i)); }
  function clearCompleted() { setItems(items.filter(i => !i.done)); }

  const shown = useMemo(() => {
    if (filter === 'active') return items.filter(i => !i.done);
    if (filter === 'done') return items.filter(i => i.done);
    return items;
  }, [items, filter]);

  return (
    <div className="panel">
      <h3 className="panel-title">Tasks</h3>
      <div className="row">
        <input className="input" placeholder="Add a task" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addItem(); }} />
        <button className="btn" onClick={addItem}>Add</button>
        <select className="select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="done">Completed</option>
        </select>
        <button className="btn secondary" onClick={clearCompleted}>Clear Completed</button>
      </div>
      <ul className="list">
        {shown.map(item => (
          <li key={item.id} className="list-item">
            <div className="item-left">
              <input type="checkbox" checked={item.done} onChange={() => toggle(item.id)} />
              <input className="input" value={item.text} onChange={e => edit(item.id, e.target.value)} />
            </div>
            <div className="item-actions">
              <button className="btn danger" onClick={() => remove(item.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
