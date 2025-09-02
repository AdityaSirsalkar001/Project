import React, { useMemo, useState } from 'react';
import { usePersistentState } from '../lib/hooks.js';

export default function Notes() {
  const [notes, setNotes] = usePersistentState('notes', []);
  const [query, setQuery] = useState('');

  function addNote() {
    const now = Date.now();
    setNotes([{ id: crypto.randomUUID(), title: 'Untitled', content: '', createdAt: now, updatedAt: now }, ...notes]);
  }

  function remove(id) { setNotes(notes.filter(n => n.id !== id)); }
  function setTitle(id, title) { setNotes(notes.map(n => n.id === id ? { ...n, title, updatedAt: Date.now() } : n)); }
  function setContent(id, content) { setNotes(notes.map(n => n.id === id ? { ...n, content, updatedAt: Date.now() } : n)); }

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return notes;
    return notes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
  }, [query, notes]);

  return (
    <div className="panel">
      <h3 className="panel-title">Notes</h3>
      <div className="row">
        <button className="btn" onClick={addNote}>New Note</button>
        <input className="input" placeholder="Search" value={query} onChange={e => setQuery(e.target.value)} />
      </div>
      <div className="grid two-col-grid">
        {filtered.map(n => (
          <div key={n.id} className="panel">
            <input className="input" value={n.title} onChange={e => setTitle(n.id, e.target.value)} />
            <textarea className="textarea" value={n.content} onChange={e => setContent(n.id, e.target.value)} />
            <div className="row between">
              <span className="small">Edited {new Date(n.updatedAt).toLocaleString()}</span>
              <button className="btn danger" onClick={() => remove(n.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
