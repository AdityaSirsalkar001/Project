import React from 'react';
import { usePersistentState } from '../lib/hooks.js';

function hoursRange(start = 6, end = 22) {
  const arr = [];
  for (let h = start; h <= end; h++) arr.push(h);
  return arr;
}

function dateKey(d = new Date()) { return d.toISOString().slice(0, 10); }
function fmtDateInput(k) { return k; }

export default function DayPlanner() {
  const [planner, setPlanner] = usePersistentState('planner', {});
  const [selected, setSelected] = usePersistentState('planner:date', dateKey());

  const daySlots = planner[selected] || {};

  function setSlot(hour, text) {
    const nextDay = { ...daySlots, [hour]: text };
    const next = { ...planner, [selected]: nextDay };
    setPlanner(next);
  }

  function changeDate(deltaDays) {
    const d = new Date(selected + 'T00:00:00');
    d.setDate(d.getDate() + deltaDays);
    setSelected(dateKey(d));
  }

  function onDateChange(e) {
    setSelected(e.target.value);
  }

  return (
    <div className="panel">
      <h3 className="panel-title">Plan Your Day</h3>
      <div className="planner-toolbar row wrap">
        <button className="btn secondary" onClick={() => changeDate(-1)}>Previous</button>
        <button className="btn secondary" onClick={() => setSelected(dateKey())}>Today</button>
        <button className="btn secondary" onClick={() => changeDate(1)}>Next</button>
        <input className="input date-input" type="date" value={fmtDateInput(selected)} onChange={onDateChange} />
        <div className="chip">{new Date(selected + 'T00:00:00').toDateString()}</div>
      </div>
      <div className="planner-grid">
        {hoursRange().map(h => (
          <div className="planner-row" key={h}>
            <div className="planner-time">{String(h).padStart(2, '0')}:00</div>
            <textarea className="planner-cell" value={daySlots[h] || ''} onChange={e => setSlot(h, e.target.value)} placeholder="Add plans, goals, meetings, or priorities" />
          </div>
        ))}
      </div>
    </div>
  );
}
