import React from 'react';
import { usePersistentState } from '../lib/hooks.js';
import ThemeToggle from './ThemeToggle.jsx';

export default function Settings() {
  const [settings, setSettings] = usePersistentState('timer:settings', {
    focusMin: 25,
    shortBreakMin: 5,
    longBreakMin: 15,
    roundsUntilLong: 4,
    autoStartBreaks: false,
    autoStartFocus: true
  });

  function exportCSV(filename, rows) {
    const csv = rows.map(r => Object.values(r).map(v => JSON.stringify(v ?? '')).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  }
  function exportTasks() {
    const todos = JSON.parse(localStorage.getItem('prodapp:todos') || '[]');
    exportCSV('tasks.csv', todos);
  }
  function exportNotes() {
    const notes = JSON.parse(localStorage.getItem('prodapp:notes') || '[]');
    exportCSV('notes.csv', notes);
  }
  function exportPlannerICS() {
    const planner = JSON.parse(localStorage.getItem('prodapp:planner') || '{}');
    let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//FocusFlow//EN\n';
    for (const [day, slots] of Object.entries(planner)) {
      for (const [hour, text] of Object.entries(slots || {})) {
        if (!text) continue;
        const start = new Date(day + 'T' + String(hour).padStart(2,'0') + ':00:00');
        const end = new Date(start.getTime() + 60*60*1000);
        const dt = (d)=> d.toISOString().replace(/[-:]/g,'').split('.')[0]+'Z';
        ics += `BEGIN:VEVENT\nUID:${crypto.randomUUID()}\nDTSTAMP:${dt(new Date())}\nDTSTART:${dt(start)}\nDTEND:${dt(end)}\nSUMMARY:${text.replace(/\n/g,' ')}\nEND:VEVENT\n`;
      }
    }
    ics += 'END:VCALENDAR';
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'planner.ics'; a.click(); URL.revokeObjectURL(url);
  }

  const [soundEnabled, setSoundEnabled] = usePersistentState('settings:sound', true);

  return (
    <div className="panel">
      <h3 className="panel-title">Settings</h3>
      <div className="section">
        <div className="panel compact">
          <h4 className="panel-title">Appearance</h4>
          <div className="row"><ThemeToggle /></div>
        </div>
        <div className="panel compact">
          <h4 className="panel-title">Audio</h4>
          <div className="settings-table">
            <div className="settings-row">
              <div className="settings-label">Sounds</div>
              <div className="settings-control">
                <label className="switch">
                  <input type="checkbox" checked={soundEnabled} onChange={e => setSoundEnabled(e.target.checked)} />
                  <span className="slider" />
                </label>
              </div>
            </div>
          </div>
        </div>
        <div className="panel">
          <h4 className="panel-title">Focus Timer</h4>
          <div className="settings-table">
            <div className="row wrap" style={{ marginBottom: 8 }}>
              <button className="btn secondary" onClick={() => setSettings({ ...settings, focusMin: 25, shortBreakMin: 5, longBreakMin: 15 })}>25/5/15</button>
              <button className="btn secondary" onClick={() => setSettings({ ...settings, focusMin: 50, shortBreakMin: 10, longBreakMin: 20 })}>50/10/20</button>
              <button className="btn secondary" onClick={() => setSettings({ ...settings, focusMin: 90, shortBreakMin: 10, longBreakMin: 30 })}>90/10/30</button>
            </div>
            <div className="settings-row">
              <div className="settings-label">Focus minutes</div>
              <div className="settings-control"><input className="input" type="number" min="1" max="180" value={settings.focusMin} onChange={(e) => setSettings({ ...settings, focusMin: Number(e.target.value) })} /></div>
            </div>
            <div className="settings-row">
              <div className="settings-label">Short break minutes</div>
              <div className="settings-control"><input className="input" type="number" min="1" max="60" value={settings.shortBreakMin} onChange={(e) => setSettings({ ...settings, shortBreakMin: Number(e.target.value) })} /></div>
            </div>
            <div className="settings-row">
              <div className="settings-label">Long break minutes</div>
              <div className="settings-control"><input className="input" type="number" min="1" max="60" value={settings.longBreakMin} onChange={(e) => setSettings({ ...settings, longBreakMin: Number(e.target.value) })} /></div>
            </div>
            <div className="settings-row">
              <div className="settings-label">Rounds until long break</div>
              <div className="settings-control"><input className="input" type="number" min="1" max="10" value={settings.roundsUntilLong} onChange={(e) => setSettings({ ...settings, roundsUntilLong: Number(e.target.value) })} /></div>
            </div>
            <div className="settings-row">
              <div className="settings-label">Auto-start breaks</div>
              <div className="settings-control">
                <label className="switch">
                  <input type="checkbox" checked={settings.autoStartBreaks} onChange={(e) => setSettings({ ...settings, autoStartBreaks: e.target.checked })} />
                  <span className="slider" />
                </label>
              </div>
            </div>
            <div className="settings-row">
              <div className="settings-label">Auto-start focus</div>
              <div className="settings-control">
                <label className="switch">
                  <input type="checkbox" checked={settings.autoStartFocus} onChange={(e) => setSettings({ ...settings, autoStartFocus: e.target.checked })} />
                  <span className="slider" />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
