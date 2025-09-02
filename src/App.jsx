import React, { useState } from 'react';
import FocusTimer from './components/FocusTimer.jsx';
import TodoList from './components/TodoList.jsx';
import Notes from './components/Notes.jsx';
import DayPlanner from './components/DayPlanner.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import Home from './components/Home.jsx';

const tabs = [
  { key: 'home', label: 'Home' },
  { key: 'focus', label: 'Focus' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'notes', label: 'Notes' },
  { key: 'planner', label: 'Planner' }
];

export default function App() {
  const [tab, setTab] = useState(() => localStorage.getItem('prodapp:tab') || 'home');
  function selectTab(k) { setTab(k); localStorage.setItem('prodapp:tab', k); }

  return (
    <div className="app-shell">
      <header className="header-bar">
        <div className="brand-title">FocusFlow</div>
        <nav className="nav-tabs">
          {tabs.map(t => (
            <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => selectTab(t.key)}>{t.label}</button>
          ))}
        </nav>
        <div className="toolbar">
          <div className="chip now-chip" aria-label="Current date and time">{new Date().toLocaleString()}</div>
          <ThemeToggle />
        </div>
      </header>

      <main className="section">
        {tab === 'home' && <Home goTo={selectTab} />}
        {tab === 'focus' && (
          <div className="grid">
            <FocusTimer />
            <TodoList />
          </div>
        )}
        {tab === 'tasks' && <TodoList />}
        {tab === 'notes' && <Notes />}
        {tab === 'planner' && <DayPlanner />}
      </main>
    </div>
  );
}
