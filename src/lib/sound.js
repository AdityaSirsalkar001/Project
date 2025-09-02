export function playTone({ freq = 880, duration = 120, type = 'sine', volume = 0.03 } = {}) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type; o.frequency.value = freq; g.gain.value = volume;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    setTimeout(() => { o.stop(); ctx.close(); }, duration);
  } catch {}
}

export function playStart() { playTone({ freq: 1046.5, duration: 120, type: 'sine' }); playTone({ freq: 1568, duration: 120, type: 'sine' }); }
export function playPause() { playTone({ freq: 392, duration: 120, type: 'square' }); }
export function playStop() { playTone({ freq: 220, duration: 160, type: 'sawtooth' }); }
export function playSessionEnd() { playTone({ freq: 1318.5, duration: 140, type: 'triangle' }); setTimeout(() => playTone({ freq: 1760, duration: 140, type: 'triangle' }), 150); }
