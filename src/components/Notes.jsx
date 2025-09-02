import React, { useMemo, useState } from 'react';
import { usePersistentState } from '../lib/hooks.js';

export default function Notes() {
  const [notes, setNotes] = usePersistentState('notes', []);
  const [query, setQuery] = usePersistentState('notes:query', '');
  const [selectedId, setSelectedId] = usePersistentState('notes:selected', null);

  function addNote() {
    const now = Date.now();
    const newNote = { id: crypto.randomUUID(), title: '', content: '', createdAt: now, updatedAt: now };
    setNotes([newNote, ...notes]);
    setSelectedId(newNote.id);
  }

  function remove(id) {
    setNotes(notes.filter(n => n.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function setTitle(id, title) { setNotes(notes.map(n => n.id === id ? { ...n, title, updatedAt: Date.now() } : n)); }
  function setContent(id, content) { setNotes(notes.map(n => n.id === id ? { ...n, content, updatedAt: Date.now() } : n)); }

  const filtered = useMemo(() => {
    const q = (query || '').toLowerCase();
    const list = notes;
    if (!q) return list;
    return list.filter(n => (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q));
  }, [query, notes]);

  const selected = notes.find(n => n.id === selectedId) || null;

  return (
    <div className="panel">
      <h3 className="panel-title">Notes</h3>
      <div className="section">
        <div className="row">
          <button className="btn" onClick={addNote}>New Note</button>
          <input className="input" placeholder="Search" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="grid two-col-grid">
          <div className="panel">
            <h4 className="panel-title">All notes</h4>
            <ul className="list">
              {filtered.map(n => (
                <li key={n.id} className="list-item" onClick={() => setSelectedId(n.id)} style={{ cursor: 'pointer' }}>
                  <div>
                    <strong>{n.title || 'Untitled'}</strong>
                    <div className="small">{new Date(n.updatedAt).toLocaleDateString()} · {(n.content || '').slice(0, 40)}</div>
                  </div>
                  <div className="item-actions">
                    <button className="btn danger" onClick={(e) => { e.stopPropagation(); remove(n.id); }}>Delete</button>
                  </div>
                </li>
              ))}
              {filtered.length === 0 && <li className="small">No notes found.</li>}
            </ul>
          </div>

          <div className="panel">
            <h4 className="panel-title">Editor</h4>
            {!selected && <p className="small">Select a note to edit.</p>}
            {selected && (
              <div className="section">
                <input className="input" placeholder="Title" value={selected.title} onChange={e => setTitle(selected.id, e.target.value)} />
                <textarea className="textarea" placeholder="Write here..." value={selected.content} onChange={e => setContent(selected.id, e.target.value)} />
                <div className="row between">
                  <span className="small">Edited {new Date(selected.updatedAt).toLocaleString()}</span>
                  <div className="row">
                    <button className="btn danger" onClick={() => remove(selected.id)}>Delete</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
