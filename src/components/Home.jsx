import React from 'react';
import { load } from '../lib/storage.js';
import { useAuth } from '../lib/AuthProvider.jsx';

function dateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fmtDuration(seconds = 0) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (h) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(' ');
}

export default function Home({ goTo }) {
  const todos = load('todos', []);
  const notes = load('notes', []);
  const planner = load('planner', {});
  const stats = load('stats:focus', {});

  const completed = todos.filter(t => t.done).length;
  const active = todos.length - completed;

  const todayKey = dateKey();
  const tomorrowKey = dateKey(new Date(Date.now() + 24 * 3600 * 1000));
  const todayStats = stats[todayKey] || { seconds: 0, sessions: 0 };
  const plannedToday = planner[todayKey] ? Object.values(planner[todayKey]).filter(Boolean).length : 0;
  const plannedTomorrow = planner[tomorrowKey] ? Object.values(planner[tomorrowKey]).filter(Boolean).length : 0;

  const recentNotes = Array.isArray(notes) ? notes.slice(0, 4) : [];
  const { user } = useAuth();
  const preferredName = (load('profile:name','') || user?.user_metadata?.full_name || user?.email?.split('@')[0] || '').trim();

  return (
    <section className="home">
      <div className="hero">
        <div className="hero-content">
          <h1 className="hero-title">FocusFlow — Your calm space to get things done</h1>
          {preferredName && <div className="small">Welcome back, {preferredName}.</div>}
          <p className="hero-subtitle">Deep focus timer, powerful tasks, flexible planner, and quick notes. Everything designed for flow.</p>
          <div className="cta-group">
            <button className="btn" onClick={() => goTo('focus')}>Start a focus session</button>
            <button className="btn secondary" onClick={() => goTo('planner')}>Plan your day</button>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card teal">
          <div className="stat-value">{fmtDuration(todayStats.seconds)}</div>
          <div className="stat-label">Focus time today</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-value">{todayStats.sessions}</div>
          <div className="stat-label">Focus sessions today</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-value">{active}</div>
          <div className="stat-label">Active tasks</div>
        </div>
        <div className="stat-card rose">
          <div className="stat-value">{completed}</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>

      <div className="home-grid">
        <div className="panel">
          <h3 className="panel-title">Upcoming</h3>
          <p className="small">Tomorrow has {plannedTomorrow} planned block{plannedTomorrow === 1 ? '' : 's'}.</p>
          <div className="row wrap">
            <button className="btn secondary" onClick={() => goTo('planner')}>Plan tomorrow</button>
          </div>
        </div>
      </div>

      <div className="home-grid">
        <div className="panel">
          <h3 className="panel-title">Quick capture</h3>
          <p className="small">Open Notes to add details. Use this space to jot an idea, then refine later.</p>
          <div className="row wrap">
            <button className="btn" onClick={() => goTo('notes')}>Open Notes</button>
            <button className="btn secondary" onClick={() => goTo('tasks')}>Add a Task</button>
          </div>
        </div>
        <div className="panel">
          <h3 className="panel-title">Today overview</h3>
          <p className="small">{plannedToday} planned block{plannedToday === 1 ? '' : 's'} · {fmtDuration(todayStats.seconds)} focused · {todayStats.sessions} session{todayStats.sessions === 1 ? '' : 's'}</p>
        </div>
      </div>

      <div className="panel">
        <h3 className="panel-title">Recent notes</h3>
        <div className="grid two-col-grid">
          {recentNotes.length === 0 && <p className="small">No notes yet.</p>}
          {recentNotes.map(n => (
            <div key={n.id} className="panel">
              <div className="row between">
                <strong>{n.title || 'Untitled'}</strong>
                <span className="small">{new Date(n.updatedAt).toLocaleDateString()}</span>
              </div>
              <p className="small">{n.content ? n.content.slice(0, 120) : 'No content'}</p>
              <div className="row"><button className="btn secondary" onClick={() => goTo('notes')}>Open</button></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
