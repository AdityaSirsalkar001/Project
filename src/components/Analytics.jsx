import React, { useMemo } from 'react';
import { load } from '../lib/storage.js';

function getDays(n = 7) { const now = new Date(); return Array.from({ length: n }, (_, i) => { const d = new Date(now); d.setDate(now.getDate() - (n - 1 - i)); return d; }); }
function dateKey(d) { const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; }
function minutes(s=0){ return Math.round((s||0)/60); }

export default function Analytics() {
  const stats = load('stats:focus', {});
  const todos = load('todos', []);
  const notes = load('notes', []);
  const planner = load('planner', {});

  const days = getDays(7);
  const daily = days.map(d => ({ key: dateKey(d), label: d.toLocaleDateString(undefined,{weekday:'short'}), seconds: (stats[dateKey(d)]?.seconds)||0, sessions: (stats[dateKey(d)]?.sessions)||0 }));
  const maxSec = Math.max(1, ...daily.map(d => d.seconds));
  const totalWeek = daily.reduce((a,b)=>a+b.seconds,0);
  const sessionWeek = daily.reduce((a,b)=>a+b.sessions,0);
  const todayKey = dateKey(new Date());
  const today = { seconds: (stats[todayKey]?.seconds)||0, sessions: (stats[todayKey]?.sessions)||0 };

  const activeTasks = todos.filter(t => !t.done).length;
  const completedTasks = todos.filter(t => t.done).length;

  const tomorrowKey = dateKey(new Date(Date.now()+24*3600*1000));
  const plannedTomorrow = planner[tomorrowKey] ? Object.values(planner[tomorrowKey]).filter(Boolean).length : 0;

  const projectCounts = useMemo(() => {
    const map = new Map();
    for (const t of todos) { const p = t.project || 'General'; map.set(p, (map.get(p)||0)+1); }
    return [...map.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6);
  }, [todos]);

  const tagCounts = useMemo(() => {
    const map = new Map();
    for (const t of todos) { for (const tag of (t.tags||[])) { const k = tag.toLowerCase(); if(!k) continue; map.set(k, (map.get(k)||0)+1); } }
    return [...map.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8);
  }, [todos]);

  const plannerBars = useMemo(() => {
    return days.map(d => {
      const key = dateKey(d); const blocks = planner[key] ? Object.values(planner[key]).filter(Boolean).length : 0;
      return { key, label: d.toLocaleDateString(undefined,{month:'short', day:'numeric'}), blocks };
    });
  }, [planner]);

  const recentNotes = Array.isArray(notes) ? notes.slice(0, 4) : [];

  function level(seconds) { const r = seconds / maxSec; if (r === 0) return 'lvl0'; if (r < .25) return 'lvl1'; if (r < .5) return 'lvl2'; if (r < .75) return 'lvl3'; return 'lvl4'; }

  return (
    <div className="panel">
      <h3 className="panel-title">Analytics</h3>
      <div className="section">
        {/* Today + Week overview (mirrors Home stats and extends) */}
        <div className="stats-grid">
          <div className="stat-card teal"><div className="stat-value">{minutes(today.seconds)}m</div><div className="stat-label">Focus today</div></div>
          <div className="stat-card amber"><div className="stat-value">{today.sessions}</div><div className="stat-label">Sessions today</div></div>
          <div className="stat-card purple"><div className="stat-value">{activeTasks}</div><div className="stat-label">Active tasks</div></div>
          <div className="stat-card rose"><div className="stat-value">{completedTasks}</div><div className="stat-label">Completed</div></div>
        </div>

        {/* Focus heatmap and trend */}
        <div className="panel">
          <h4 className="panel-title">Focus last 7 days</h4>
          <div className="heatmap">
            {daily.map(d => (
              <div key={d.key} className={`cell ${level(d.seconds)}`} title={`${d.label}: ${minutes(d.seconds)} min, ${d.sessions} sessions`} />
            ))}
          </div>
          <div className="bar-grid">
            {daily.map(d => (
              <div key={d.key} className="bar-row">
                <span className="bar-label">{d.label}</span>
                <div className="bar"><div className="bar-fill" style={{ width: `${Math.max(4, (d.seconds/maxSec)*100)}%` }} /></div>
                <span className="bar-value">{minutes(d.seconds)}m</span>
              </div>
            ))}
          </div>
          <div className="row wrap"><div className="chip">Week total: {minutes(totalWeek)}m</div><div className="chip">Sessions: {sessionWeek}</div></div>
        </div>

        {/* Planner overview */}
        <div className="panel">
          <h4 className="panel-title">Planner overview</h4>
          <p className="small">Tomorrow: {plannedTomorrow} block{plannedTomorrow===1?'':'s'}</p>
          <div className="bar-grid">
            {plannerBars.map(p => (
              <div key={p.key} className="bar-row">
                <span className="bar-label">{p.label}</span>
                <div className="bar"><div className="bar-fill amber" style={{ width: `${Math.min(100, p.blocks*10)}%` }} /></div>
                <span className="bar-value">{p.blocks}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks breakdown */}
        <div className="panel">
          <h4 className="panel-title">Tasks breakdown</h4>
          <div className="row wrap">
            {projectCounts.map(([p,c]) => (<div key={p} className="chip">{p}: {c}</div>))}
          </div>
          <div className="row wrap">
            {tagCounts.length ? tagCounts.map(([t,c]) => (<div key={t} className="chip">#{t} · {c}</div>)) : <span className="small">No tags yet.</span>}
          </div>
        </div>

        {/* Notes summary */}
        <div className="panel">
          <h4 className="panel-title">Notes</h4>
          <div className="row wrap"><div className="chip">Total: {notes.length}</div></div>
          <div className="grid two-col-grid">
            {recentNotes.length === 0 && <p className="small">No notes yet.</p>}
            {recentNotes.map(n => (
              <div key={n.id} className="panel">
                <div className="row between"><strong>{n.title || 'Untitled'}</strong><span className="small">{new Date(n.updatedAt).toLocaleDateString()}</span></div>
                <p className="small">{(n.content||'').slice(0,120) || 'No content'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
