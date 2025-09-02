import React, { useEffect, useState } from 'react';
import FocusTimer from './components/FocusTimer.jsx';
import TodoList from './components/TodoList.jsx';
import Notes from './components/Notes.jsx';
import DayPlanner from './components/DayPlanner.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import Home from './components/Home.jsx';
import { AuthProvider } from './lib/AuthProvider.jsx';
import Profile from './components/Profile.jsx';
import Settings from './components/Settings.jsx';
import Analytics from './components/Analytics.jsx';
import CommandPalette from './components/CommandPalette.jsx';

const tabs = [
  { key: 'home', label: 'Home' },
  { key: 'focus', label: 'Focus' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'notes', label: 'Notes' },
  { key: 'planner', label: 'Planner' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'settings', label: 'Settings' },
  { key: 'profile', label: 'Profile' }
];

export default function App() {
  const [tab, setTab] = useState(() => localStorage.getItem('prodapp:tab') || 'home');
  function selectTab(k) { setTab(k); localStorage.setItem('prodapp:tab', k); }
  function accentForTab(k) {
    switch (k) {
      case 'tasks': return 'teal';
      case 'notes': return 'amber';
      case 'planner': return 'purple';
      case 'analytics': return 'rose';
      case 'settings': return 'teal';
      case 'profile': return 'purple';
      case 'focus': return 'blue';
      default: return 'blue';
    }
  }
  useEffect(() => {
    document.body.setAttribute('data-accent', accentForTab(tab));
  }, [tab]);
  useEffect(() => {
    const current = tabs.find(t => t.key === tab)?.label || 'App';
    document.title = `FocusFlow — ${current}`;
  }, [tab]);

  const [paletteOpen, setPaletteOpen] = useState(false);
  return (
    <AuthProvider>
      <div className="app-shell">
        <header className="header-bar">
          <div className="brand-title"><span className="brand-logo" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--primary)"/><stop offset="1" stop-color="#7c3aed"/></linearGradient></defs><path d="M12 3c4.97 0 9 4.03 9 9s-4.03 9-9 9S3 16.97 3 12 7.03 3 12 3z" fill="url(#g)" opacity="0.2"/><path d="M6 12c2.5-2.2 5.5-2.2 8 0 2.5 2.2 5.5 2.2 8 0" stroke="url(#g)" stroke-width="2" stroke-linecap="round"/></svg></span> FocusFlow</div>
          <nav className="nav-tabs">
            {tabs.map(t => (
              <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => selectTab(t.key)}>{t.label}</button>
            ))}
          </nav>
          <div className="toolbar">
            <ThemeToggle />
          </div>
        </header>

        <main className="section">
          <div key={tab} className="page-animate">
            {tab === 'home' && <Home goTo={selectTab} />}
            {tab === 'focus' && (
              <div className="grid section-accent-focus" style={{ gridTemplateColumns: '1fr' }}>
                <FocusTimer />
              </div>
            )}
            {tab === 'tasks' && <div className="section-accent-tasks"><TodoList /></div>}
            {tab === 'notes' && <div className="section-accent-notes"><Notes /></div>}
            {tab === 'planner' && <div className="section-accent-planner"><DayPlanner /></div>}
            {tab === 'analytics' && <div className="section-accent-analytics"><Analytics /></div>}
            {tab === 'settings' && <div className="section-accent-settings"><Settings /></div>}
            {tab === 'profile' && <div className="section-accent-profile"><Profile /></div>}
          </div>
        </main>
      </div>
      <CommandPalette open={paletteOpen} onClose={(v)=> setPaletteOpen(!!v)} goTo={selectTab} />
    </AuthProvider>
  );
}
