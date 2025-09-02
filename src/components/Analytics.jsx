import React, { useMemo } from 'react';
import { load } from '../lib/storage.js';

function getWeekDays() { const now = new Date(); const days = []; for (let i = 6; i >= 0; i--) { const d = new Date(now); d.setDate(now.getDate() - i); days.push(d); } return days; }
function dateKey(d) { const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; }

export default function Analytics() {
  const stats = load('stats:focus', {});
  const days = getWeekDays();
  const data = days.map(d => ({ key: dateKey(d), label: d.toLocaleDateString(undefined, { weekday: 'short' }), seconds: (stats[dateKey(d)]?.seconds) || 0 }));
  const max = Math.max(1, ...data.map(d => d.seconds));
  const totalWeek = data.reduce((a,b)=>a+b.seconds,0);
  const sessions = days.reduce((sum, d)=>sum + ((stats[dateKey(d)]?.sessions)||0), 0);

  const streak = useMemo(() => {
    let s = 0; for (let i = days.length-1; i >= 0; i--) { const v = stats[dateKey(days[i])]?.seconds || 0; if (v>0) s++; else break; } return s;
  }, [stats]);

  function level(seconds) { const r = seconds / max; if (r === 0) return 'lvl0'; if (r < .25) return 'lvl1'; if (r < .5) return 'lvl2'; if (r < .75) return 'lvl3'; return 'lvl4'; }

  return (
    <div className="panel">
      <h3 className="panel-title">Weekly Analytics</h3>
      <div className="section">
        <div className="heatmap">
          {data.map(d => (
            <div key={d.key} className={`cell ${level(d.seconds)}`} title={`${d.label}: ${Math.round(d.seconds/60)} min`} />
          ))}
        </div>
        <div className="row wrap">
          <div className="chip">Week total: {Math.round(totalWeek/60)} min</div>
          <div className="chip">Sessions: {sessions}</div>
          <div className="chip">Streak: {streak} day{streak===1?'':'s'}</div>
        </div>
      </div>
    </div>
  );
}
