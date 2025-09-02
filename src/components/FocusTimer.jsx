import React, { useEffect, useMemo } from 'react';
import { useInterval } from '../lib/hooks.js';
import { usePersistentState } from '../lib/hooks.js';
import { load, save } from '../lib/storage.js';

function fmt(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function dateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function incTodaySeconds(delta = 1) {
  const key = 'stats:focus';
  const stats = load(key, {});
  const k = dateKey();
  const cur = stats[k] || { seconds: 0, sessions: 0 };
  cur.seconds += delta;
  stats[k] = cur;
  save(key, stats);
}

function incTodaySessions() {
  const key = 'stats:focus';
  const stats = load(key, {});
  const k = dateKey();
  const cur = stats[k] || { seconds: 0, sessions: 0 };
  cur.sessions += 1;
  stats[k] = cur;
  save(key, stats);
}

export default function FocusTimer() {
  const [settings, setSettings] = usePersistentState('timer:settings', {
    focusMin: 25,
    shortBreakMin: 5,
    longBreakMin: 15,
    roundsUntilLong: 4
  });
  const [mode, setMode] = usePersistentState('timer:mode', 'focus');
  const [round, setRound] = usePersistentState('timer:round', 1);
  const [remaining, setRemaining] = usePersistentState('timer:remaining', 25 * 60);
  const [running, setRunning] = usePersistentState('timer:running', false);

  // derive total based on mode
  const total = useMemo(() => (
    mode === 'focus' ? settings.focusMin * 60 : mode === 'short' ? settings.shortBreakMin * 60 : settings.longBreakMin * 60
  ), [mode, settings.focusMin, settings.shortBreakMin, settings.longBreakMin]);

  // ensure remaining aligns when mode or settings change
  useEffect(() => {
    setRemaining(total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, mode]);

  useInterval(() => {
    if (!running) return;
    if (mode === 'focus') incTodaySeconds(1);
    setRemaining((r) => {
      if (r > 1) return r - 1;
      handleComplete();
      return 0;
    });
  }, 1000);

  function handleComplete() {
    setRunning(false);
    if (mode === 'focus') {
      incTodaySessions();
      if (round >= settings.roundsUntilLong) {
        setMode('long');
        setRound(1);
      } else {
        setMode('short');
        setRound(round + 1);
      }
    } else {
      setMode('focus');
    }
  }

  function start() { setRunning(true); }
  function pause() { setRunning(false); }
  function reset() { setRunning(false); setRemaining(total); }

  function switchMode(next) {
    setRunning(false);
    setMode(next);
    if (next === 'focus') setRound(1);
    setRemaining(
      next === 'focus' ? settings.focusMin * 60 : next === 'short' ? settings.shortBreakMin * 60 : settings.longBreakMin * 60
    );
  }

  const title = useMemo(() => mode === 'focus' ? 'Focus' : mode === 'short' ? 'Short Break' : 'Long Break', [mode]);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, remaining / total));
  const dash = circumference;
  const offset = dash * (1 - progress);

  return (
    <div className="panel">
      <h3 className="panel-title">Focus</h3>
      <div className="section">
        <div className="mode-tabs row center">
          <button className={`mode-btn ${mode === 'focus' ? 'active' : ''}`} onClick={() => switchMode('focus')} aria-pressed={mode === 'focus'}>Focus</button>
          <button className={`mode-btn ${mode === 'short' ? 'active' : ''}`} onClick={() => switchMode('short')} aria-pressed={mode === 'short'}>Short</button>
          <button className={`mode-btn ${mode === 'long' ? 'active' : ''}`} onClick={() => switchMode('long')} aria-pressed={mode === 'long'}>Long</button>
        </div>

        <div className="timer-wrap">
          <svg className="timer-ring" viewBox="0 0 200 200" width="200" height="200" aria-label={`${title} timer`}>
            <circle cx="100" cy="100" r={radius} stroke="var(--border)" strokeWidth="14" fill="none" />
            <circle
              cx="100"
              cy="100"
              r={radius}
              stroke="var(--primary)"
              strokeWidth="14"
              fill="none"
              strokeDasharray={dash}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 100 100)"
            />
            <text x="100" y="108" textAnchor="middle" fontSize="32" fontWeight="800" fill="currentColor">{fmt(remaining)}</text>
          </svg>
          <div className="row center">
            {!running ? (
              <button className="btn success" onClick={start}>Start</button>
            ) : (
              <button className="btn secondary" onClick={pause}>Pause</button>
            )}
            <button className="btn secondary" onClick={reset}>Reset</button>
          </div>
          <div className="row between">
            <span className="small">{title}</span>
            <span className="small">Round {round} / {settings.roundsUntilLong}</span>
          </div>
        </div>

        <div className="grid">
          <div className="panel">
            <h4 className="panel-title">Settings</h4>
            <div className="section">
              <label>
                <div className="small">Focus minutes</div>
                <input className="input" type="number" min="1" max="180" value={settings.focusMin} onChange={(e) => setSettings({ ...settings, focusMin: Number(e.target.value) })} />
              </label>
              <label>
                <div className="small">Short break minutes</div>
                <input className="input" type="number" min="1" max="60" value={settings.shortBreakMin} onChange={(e) => setSettings({ ...settings, shortBreakMin: Number(e.target.value) })} />
              </label>
              <label>
                <div className="small">Long break minutes</div>
                <input className="input" type="number" min="1" max="60" value={settings.longBreakMin} onChange={(e) => setSettings({ ...settings, longBreakMin: Number(e.target.value) })} />
              </label>
              <label>
                <div className="small">Rounds until long break</div>
                <input className="input" type="number" min="1" max="10" value={settings.roundsUntilLong} onChange={(e) => setSettings({ ...settings, roundsUntilLong: Number(e.target.value) })} />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
