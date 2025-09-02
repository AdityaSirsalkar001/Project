import React from 'react';
import { usePersistentState } from '../lib/hooks.js';

function hoursRange(start = 6, end = 22) {
  const arr = [];
  for (let h = start; h <= end; h++) arr.push(h);
  return arr;
}

export default function DayPlanner() {
  const [slots, setSlots] = usePersistentState('planner', {});

  function setSlot(hour, text) {
    const next = { ...slots, [hour]: text };
    setSlots(next);
  }

  return (
    <div className="panel">
      <h3 className="panel-title">Plan Your Day</h3>
      <div className="planner-grid">
        {hoursRange().map(h => (
          <div className="planner-row" key={h}>
            <div className="planner-time">{String(h).padStart(2, '0')}:00</div>
            <textarea className="planner-cell" value={slots[h] || ''} onChange={e => setSlot(h, e.target.value)} placeholder="Add plans, goals, meetings, or priorities" />
          </div>
        ))}
      </div>
    </div>
  );
}
