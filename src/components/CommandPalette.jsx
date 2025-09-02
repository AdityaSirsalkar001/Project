import React, { useEffect, useMemo, useState } from 'react';

export default function CommandPalette({ open, onClose, goTo, actions }) {
  const [q, setQ] = useState('');
  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); onClose(open ? false : true); }
      if (e.key === 'Escape') onClose(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const list = useMemo(() => {
    const base = [
      { id: 'nav:focus', label: 'Go to Focus', run: () => goTo('focus') },
      { id: 'nav:tasks', label: 'Go to Tasks', run: () => goTo('tasks') },
      { id: 'nav:notes', label: 'Go to Notes', run: () => goTo('notes') },
      { id: 'nav:planner', label: 'Go to Planner', run: () => goTo('planner') },
      { id: 'nav:analytics', label: 'Go to Analytics', run: () => goTo('analytics') },
      { id: 'nav:settings', label: 'Go to Settings', run: () => goTo('settings') },
      ...(actions||[])
    ];
    const text = q.toLowerCase();
    if (!text) return base;
    return base.filter(a => a.label.toLowerCase().includes(text));
  }, [q, goTo, actions]);

  if (!open) return null;
  return (
    <div className="palette-overlay" onClick={() => onClose(false)}>
      <div className="palette" onClick={e => e.stopPropagation()}>
        <input className="input" autoFocus placeholder="Type a command... (Esc to close)" value={q} onChange={e => setQ(e.target.value)} />
        <div className="palette-list">
          {list.map(a => (
            <button key={a.id} className="palette-item" onClick={() => { a.run(); onClose(false); }}>{a.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
