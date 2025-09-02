import React, { useEffect, useMemo, useState } from 'react';
import { useInterval } from '../lib/hooks.js';
import { usePersistentState } from '../lib/hooks.js';

function fmt(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
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
  const [remaining, setRemaining] = usePersistentState('timer:remaining', settings.focusMin * 60);
  const [running, setRunning] = usePersistentState('timer:running', false);

  useEffect(() => {
    if (mode === 'focus') setRemaining(settings.focusMin * 60);
    if (mode === 'short') setRemaining(settings.shortBreakMin * 60);
    if (mode === 'long') setRemaining(settings.longBreakMin * 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.focusMin, settings.shortBreakMin, settings.longBreakMin, mode]);

  useInterval(() => {
    if (!running) return;
    setRemaining((r) => {
      if (r > 1) return r - 1;
      handleComplete();
      return 0;
    });
  }, 1000);

  function handleComplete() {
    setRunning(false);
    if (mode === 'focus') {
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
  function reset() {
    setRunning(false);
    if (mode === 'focus') setRemaining(settings.focusMin * 60);
    if (mode === 'short') setRemaining(settings.shortBreakMin * 60);
    if (mode === 'long') setRemaining(settings.longBreakMin * 60);
  }

  const title = useMemo(() => mode === 'focus' ? 'Focus' : mode === 'short' ? 'Short Break' : 'Long Break', [mode]);

  return (
    <div className="panel">
      <h3 className="panel-title">Focus Timer</h3>
      <div className="section">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <strong>{title}</strong>
          <span className="small">Round {round} / {settings.roundsUntilLong}</span>
        </div>
        <div style={{ fontSize: 48, textAlign: 'center', fontWeight: 800 }}>{fmt(remaining)}</div>
        <div className="row" style={{ justifyContent: 'center' }}>
          {!running ? <button className="btn success" onClick={start}>Start</button> : <button className="btn secondary" onClick={pause}>Pause</button>}
          <button className="btn secondary" onClick={reset}>Reset</button>
          <button className="btn" onClick={() => setMode('focus')}>Focus</button>
          <button className="btn" onClick={() => setMode('short')}>Short</button>
          <button className="btn" onClick={() => setMode('long')}>Long</button>
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
