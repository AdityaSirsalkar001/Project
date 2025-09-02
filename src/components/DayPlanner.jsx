import React from 'react';
import { usePersistentState } from '../lib/hooks.js';

function hoursRange(start = 6, end = 22) {
  const arr = [];
  for (let h = start; h <= end; h++) arr.push(h);
  return arr;
}

function dateKeyLocal(d = new Date()) { const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; }
function fmtDateInput(k) { return k; }

export default function DayPlanner() {
  const [planner, setPlanner] = usePersistentState('planner', {});
  const [selected, setSelected] = usePersistentState('planner:date', dateKeyLocal());

  const daySlots = planner[selected] || {};

  function setSlot(hour, text) {
    const nextDay = { ...daySlots, [hour]: text };
    const next = { ...planner, [selected]: nextDay };
    setPlanner(next);
  }

  function changeDate(deltaDays) {
    const d = new Date(selected + 'T00:00:00');
    d.setDate(d.getDate() + deltaDays);
    setSelected(dateKeyLocal(d));
  }

  function onDateChange(e) {
    setSelected(e.target.value);
  }

  return (
    <div className="panel">
      <h3 className="panel-title">Plan Your Day</h3>
      <div className="planner-toolbar row wrap">
        <button className="btn secondary" onClick={() => changeDate(-1)}>Previous</button>
        <button className="btn secondary" onClick={() => setSelected(dateKeyLocal())}>Today</button>
        <button className="btn secondary" onClick={() => changeDate(1)}>Next</button>
        <input className="input date-input" type="date" value={fmtDateInput(selected)} onChange={onDateChange} />
      </div>
      <div className="planner-grid">
        {hoursRange().map(h => (
          <div className="planner-row" key={h}>
            <div className="planner-time">{String(h).padStart(2, '0')}:00</div>
            <textarea className="planner-cell" value={daySlots[h] || ''} onChange={e => setSlot(h, e.target.value)} placeholder="Add event, task, or note" />
          </div>
        ))}
      </div>
    </div>
  );
}
