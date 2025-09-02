import React, { useState } from 'react';
import { useAuth } from '../lib/AuthProvider.jsx';

export default function AuthForm() {
  const { supabase } = useAuth();
  const [mode, setMode] = useState('signin'); // signin | signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!supabase) {
    return (
      <div className="panel">
        <h4 className="panel-title">Authentication not configured</h4>
        <p className="small">To enable Sign in/Sign up (including Google), connect Supabase and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in settings. Then reload.</p>
      </div>
    );
  }

  async function handleEmailAuth(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (mode === 'signin') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
      }
    } catch (err) {
      setError(err.message || 'Authentication error');
    } finally { setLoading(false); }
  }

  async function handleGoogle() {
    setError('');
    const redirectTo = window.location.origin;
    const { error: err } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
    if (err) setError(err.message || 'OAuth error');
  }

  return (
    <div className="panel">
      <h4 className="panel-title">{mode === 'signin' ? 'Sign in' : 'Sign up'}</h4>
      <div className="row wrap" style={{ gap: 6 }}>
        <button className={`mode-btn ${mode === 'signin' ? 'active' : ''}`} onClick={() => setMode('signin')}>Sign in</button>
        <button className={`mode-btn ${mode === 'signup' ? 'active' : ''}`} onClick={() => setMode('signup')}>Sign up</button>
      </div>
      <form className="section" onSubmit={handleEmailAuth}>
        <label>
          <div className="small">Email</div>
          <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </label>
        <label>
          <div className="small">Password</div>
          <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </label>
        {error && <div className="small" style={{ color: 'var(--danger)' }}>{error}</div>}
        <div className="row">
          <button className="btn" type="submit" disabled={loading}>{loading ? 'Please wait...' : (mode === 'signin' ? 'Sign in' : 'Create account')}</button>
          <button className="btn secondary" type="button" onClick={handleGoogle}>Continue with Google</button>
        </div>
      </form>
    </div>
  );
}
