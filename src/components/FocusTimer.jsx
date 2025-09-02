import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useInterval } from '../lib/hooks.js';
import { usePersistentState } from '../lib/hooks.js';
import { load, save } from '../lib/storage.js';
import { playStart, playPause, playStop, playSessionEnd } from '../lib/sound.js';
import { load as loadLS } from '../lib/storage.js';

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
    roundsUntilLong: 4,
    autoStartBreaks: false,
    autoStartFocus: true
  });

  const [modeType, setModeType] = usePersistentState('timer:type', 'timer'); // 'timer' | 'stopwatch'

  // Timer state
  const [mode, setMode] = usePersistentState('timer:mode', 'focus'); // 'focus' | 'short' | 'long'
  const [round, setRound] = usePersistentState('timer:round', 1);
  const [remaining, setRemaining] = usePersistentState('timer:remaining', 25 * 60);
  const [running, setRunning] = usePersistentState('timer:running', false);

  // Stopwatch state
  const [swElapsed, setSwElapsed] = usePersistentState('stopwatch:elapsed', 0);
  const [swRunning, setSwRunning] = usePersistentState('stopwatch:running', false);
  const [swActive, setSwActive] = usePersistentState('stopwatch:active', false); // counts a session when stopping

  // Fullscreen state
  const wrapRef = useRef(null);
  const [isFs, setIsFs] = useState(false);
  useEffect(() => {
    const onFs = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      wrapRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  // derive total based on mode
  const total = useMemo(() => (
    mode === 'focus' ? settings.focusMin * 60 : mode === 'short' ? settings.shortBreakMin * 60 : settings.longBreakMin * 60
  ), [mode, settings.focusMin, settings.shortBreakMin, settings.longBreakMin]);

  // keep remaining synced to total
  useEffect(() => { if (modeType === 'timer') setRemaining(total); }, [total, modeType]);

  useInterval(() => {
    if (modeType !== 'timer' || !running) return;
    if (mode === 'focus') incTodaySeconds(1);
    setRemaining((r) => {
      if (r > 1) return r - 1;
      handleComplete();
      return 0;
    });
  }, 1000);

  useInterval(() => {
    if (modeType !== 'stopwatch' || !swRunning) return;
    setSwElapsed((v) => v + 1);
    incTodaySeconds(1);
  }, 1000);

  function handleComplete() { if (loadLS('settings:sound', true)) playSessionEnd();
    setRunning(false);
    if (mode === 'focus') {
      incTodaySessions();
      if (round >= settings.roundsUntilLong) {
        setMode('long');
        setRound(1);
        if (settings.autoStartBreaks) setRunning(true);
      } else {
        setMode('short');
        setRound(round + 1);
        if (settings.autoStartBreaks) setRunning(true);
      }
    } else {
      setMode('focus');
      if (settings.autoStartFocus) setRunning(true);
    }
  }

  function start() { setRunning(true); if (loadLS('settings:sound', true)) playStart(); }
  function pause() { setRunning(false); if (loadLS('settings:sound', true)) playPause(); }
  function reset() { setRunning(false); setRemaining(total); }

  function switchMode(next) {
    setRunning(false);
    setMode(next);
    if (next === 'focus') setRound(1);
    setRemaining(next === 'focus' ? settings.focusMin * 60 : next === 'short' ? settings.shortBreakMin * 60 : settings.longBreakMin * 60);
  }

  // Stopwatch controls
  function swStart() { setSwRunning(true); setSwActive(true); }
  function swPause() {
    setSwRunning(false);
    if (swElapsed > 0 && swActive) { incTodaySessions(); setSwActive(false); }
  }
  function swReset() { setSwRunning(false); setSwElapsed(0); setSwActive(false); }

  const title = useMemo(() => mode === 'focus' ? 'Focus' : mode === 'short' ? 'Short Break' : 'Long Break', [mode]);

  // ring
  const radius = 90; const circumference = 2 * Math.PI * radius;
  const progress = modeType === 'timer' ? Math.max(0, Math.min(1, remaining / total)) : 1 - ((swElapsed % 60) / 60);
  const dash = circumference; const offset = dash * (1 - progress);

  function stopTimer() { setRunning(false); setRemaining(total); if (loadLS('settings:sound', true)) playStop(); }
  function stopStopwatch() { if (swElapsed > 0 && swActive) { incTodaySessions(); } setSwRunning(false); setSwElapsed(0); setSwActive(false); if (loadLS('settings:sound', true)) playStop(); }

  return (
    <div ref={wrapRef} className={isFs ? 'focus-fullscreen' : ''}>
      <div className="panel focus-accent">
        <h3 className="panel-title">Focus</h3>
        <div className="section">
          {!isFs && (
            <div className="row center" style={{ gap: 8 }}>
              <button className={`mode-btn ${modeType === 'timer' ? 'active' : ''}`} onClick={() => setModeType('timer')}>Timer</button>
              <button className={`mode-btn ${modeType === 'stopwatch' ? 'active' : ''}`} onClick={() => setModeType('stopwatch')}>Stopwatch</button>
            </div>
          )}

          {modeType === 'timer' && (
            <>
              {!isFs && (
                <div className="row center" style={{ gap: 6 }}>
                  <button className={`mode-btn focus-variant ${mode === 'focus' ? 'active' : ''}`} onClick={() => switchMode('focus')} aria-pressed={mode === 'focus'}>Focus</button>
                  <button className={`mode-btn short-variant ${mode === 'short' ? 'active' : ''}`} onClick={() => switchMode('short')} aria-pressed={mode === 'short'}>Short</button>
                  <button className={`mode-btn long-variant ${mode === 'long' ? 'active' : ''}`} onClick={() => switchMode('long')} aria-pressed={mode === 'long'}>Long</button>
                </div>
              )}
              <div className={`timer-wrap ${mode === 'focus' ? 'accent-blue' : mode === 'short' ? 'accent-amber' : 'accent-purple'}`}>
                <svg className="timer-ring" viewBox="0 0 220 220" width={isFs ? 300 : 240} height={isFs ? 300 : 240} aria-label={`${title} timer`}>
                  <circle cx="110" cy="110" r={radius} stroke="var(--border)" strokeWidth="14" fill="none" />
                  <circle cx="110" cy="110" r={radius} stroke="currentColor" strokeWidth="14" fill="none" strokeDasharray={dash} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 110 110)" />
                  <text x="110" y="118" textAnchor="middle" fontSize={isFs ? 44 : 36} fontWeight="800" fill="currentColor">{fmt(remaining)}</text>
                </svg>
                <div className="row center">
                  {!running ? (
                    <button className="btn success" onClick={start}>Start</button>
                  ) : (
                    <button className="btn secondary" onClick={pause}>Pause</button>
                  )}
                  {!isFs && <button className="btn secondary" onClick={reset}>Reset</button>}
                  <button className="btn" onClick={isFs ? () => document.exitFullscreen?.() : toggleFullscreen}>{isFs ? 'Exit' : 'Fullscreen'}</button>
                  {isFs && <button className="btn danger" onClick={stopTimer}>Stop</button>}
                </div>
                {!isFs && (
                  <div className="row between">
                    <span className="small">{title}</span>
                    <span className="small">Round {round} / {settings.roundsUntilLong}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {modeType === 'stopwatch' && (
            <div className="timer-wrap accent-teal">
              <svg className="timer-ring" viewBox="0 0 220 220" width={isFs ? 300 : 240} height={isFs ? 300 : 240} aria-label={`Stopwatch`}>
                <circle cx="110" cy="110" r={radius} stroke="var(--border)" strokeWidth="14" fill="none" />
                <circle cx="110" cy="110" r={radius} stroke="currentColor" strokeWidth="14" fill="none" strokeDasharray={dash} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 110 110)" />
                <text x="110" y="118" textAnchor="middle" fontSize={isFs ? 44 : 36} fontWeight="800" fill="currentColor">{fmt(swElapsed)}</text>
              </svg>
              <div className="row center">
                {!swRunning ? (
                  <button className="btn success" onClick={swStart}>Start</button>
                ) : (
                  <button className="btn secondary" onClick={swPause}>Pause</button>
                )}
                {!isFs && <button className="btn secondary" onClick={swReset}>Reset</button>}
                <button className="btn" onClick={isFs ? () => document.exitFullscreen?.() : toggleFullscreen}>{isFs ? 'Exit' : 'Fullscreen'}</button>
                {isFs && <button className="btn danger" onClick={stopStopwatch}>Stop</button>}
              </div>
              {!isFs && (
                <div className="row between">
                  <span className="small">Stopwatch</span>
                  <span className="small">Counts focus stats while running</span>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
