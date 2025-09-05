import React from 'react';
import { usePersistentState } from '../lib/hooks.js';

function hoursRange(start = 6, end = 22) {
  const arr = [];
  for (let h = start; h <= end; h++) arr.push(h);
  return arr;
}

function dateKeyLocal(d = new Date()) { const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; }
function fmtDateInput(k) { return k; }

function addDays(d, delta) { const nd = new Date(d + 'T00:00:00'); nd.setDate(nd.getDate() + delta); return nd; }
function labelFor(key) { const d = new Date(key + 'T00:00:00'); return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }); }

export default function DayPlanner() {
  const [planner, setPlanner] = usePersistentState('planner', {});
  const [selected, setSelected] = usePersistentState('planner:date', dateKeyLocal());
  const [days, setDays] = usePersistentState('planner:span', 5);

  function getDaySlots(dayKey) { return planner[dayKey] || {}; }
  function slotFor(dayKey, hour) {
    const v = getDaySlots(dayKey)[hour];
    if (typeof v === 'string') return { text: v, done: false };
    return { text: v?.text || '', done: !!v?.done };
  }

  function setSlot(dayKey, hour, text) {
    const prev = slotFor(dayKey, hour);
    const nextDay = { ...getDaySlots(dayKey), [hour]: { text, done: prev.done } };
    const next = { ...planner, [dayKey]: nextDay };
    setPlanner(next);
  }

  function setDone(dayKey, hour, done) {
    const prev = slotFor(dayKey, hour);
    const nextDay = { ...getDaySlots(dayKey), [hour]: { text: prev.text, done } };
    const next = { ...planner, [dayKey]: nextDay };
    setPlanner(next);
  }

  function changeDate(deltaDays) {
    const d = new Date(selected + 'T00:00:00');
    d.setDate(d.getDate() + deltaDays);
    setSelected(dateKeyLocal(d));
  }

  function onDateChange(e) { setSelected(e.target.value); }

  const dayKeys = Array.from({ length: Number(days) }, (_, i) => dateKeyLocal(addDays(selected, i)));

  return (
    <div className="panel">
      <h3 className="panel-title">Plan Your Day</h3>
      <div className="planner-toolbar row wrap">
        <button className="btn secondary" onClick={() => changeDate(-Number(days))}>Previous</button>
        <button className="btn secondary" onClick={() => setSelected(dateKeyLocal())}>Today</button>
        <button className="btn secondary" onClick={() => changeDate(Number(days))}>Next</button>
        <input className="input date-input" type="date" value={fmtDateInput(selected)} onChange={onDateChange} />
        <select className="select days-span-select" value={days} onChange={e => setDays(Number(e.target.value))}>
          <option value={3}>3 days</option>
          <option value={5}>5 days</option>
          <option value={7}>7 days</option>
        </select>
      </div>

      <div className="planner-matrix-wrapper">
        <div className="planner-matrix" style={{ '--days': days }}>
          <div className="planner-matrix-header">
            <div className="planner-time"></div>
            {dayKeys.map(k => (
              <div className="planner-day-label" key={k}>{labelFor(k)}</div>
            ))}
          </div>
          {hoursRange().map(h => (
            <div className="planner-matrix-row" key={h}>
              <div className="planner-time">{String(h).padStart(2, '0')}:00</div>
              {dayKeys.map(k => {
                const slot = slotFor(k, h);
                return (
                  <div key={k + '-' + h} className={`planner-slot ${slot.done ? 'planner-done' : ''}`}>
                    <input className="planner-checkbox" type="checkbox" checked={slot.done} onChange={e => setDone(k, h, e.target.checked)} />
                    <textarea className="planner-cell" value={slot.text} onChange={e => setSlot(k, h, e.target.value)} placeholder="Add event, task, or note" />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
