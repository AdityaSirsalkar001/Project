import React from 'react';
import { load } from '../lib/storage.js';

export default function Home({ goTo }) {
  const todos = load('todos', []);
  const notes = load('notes', []);
  const planner = load('planner', {});
  const completed = todos.filter(t => t.done).length;
  const active = todos.length - completed;
  const plannedBlocks = Object.values(planner).filter(Boolean).length;

  return (
    <section className="home">
      <div className="hero">
        <div className="hero-content">
          <div className="badge">Premium productivity</div>
          <h1 className="hero-title">Focus better. Plan smarter. Achieve more.</h1>
          <p className="hero-subtitle">A clean, fast workspace for deep work, tasks, notes, and your daily plan — all in one place.</p>
          <div className="cta-group">
            <button className="btn" onClick={() => goTo('focus')}>Start a focus session</button>
            <button className="btn secondary" onClick={() => goTo('planner')}>Plan your day</button>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{active}</div>
          <div className="stat-label">Active tasks</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{completed}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{notes.length}</div>
          <div className="stat-label">Notes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{plannedBlocks}</div>
          <div className="stat-label">Planned blocks today</div>
        </div>
      </div>

      <div className="home-grid">
        <div className="panel">
          <h3 className="panel-title">Jump back in</h3>
          <div className="row wrap">
            <button className="btn" onClick={() => goTo('focus')}>Focus</button>
            <button className="btn" onClick={() => goTo('tasks')}>Tasks</button>
            <button className="btn" onClick={() => goTo('notes')}>Notes</button>
            <button className="btn" onClick={() => goTo('planner')}>Planner</button>
          </div>
        </div>
        <div className="panel">
          <h3 className="panel-title">Tip</h3>
          <p className="small">Use the theme toggle in the header to switch between light and dark for the perfect focus environment.</p>
        </div>
      </div>
    </section>
  );
}
