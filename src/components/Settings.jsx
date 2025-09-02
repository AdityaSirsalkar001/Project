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

  return (
    <div className="panel">
      <h3 className="panel-title">Settings</h3>
      <div className="section">
        <div className="panel compact">
          <h4 className="panel-title">Appearance</h4>
          <div className="row"><ThemeToggle /></div>
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
