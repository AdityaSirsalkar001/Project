import React, { useState } from 'react';
import { useAuth } from '../lib/AuthProvider.jsx';

export default function AuthForm() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState('signin'); // signin | signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);


  async function handleEmailAuth(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (err) {
      setError(err.message || 'Authentication error');
    } finally { setLoading(false); }
  }

  async function handleGoogle() {
    setError('');
    try { await signInWithGoogle(); } catch (err) { setError(err.message || 'OAuth error'); }
  }

  return (
    <div className="panel">
      <h4 className="panel-title">{mode === 'signin' ? 'Sign in' : 'Sign up'}</h4>
      <div className="row wrap auth-switch" style={{ gap: 6 }}>
        <button className={`mode-btn ${mode === 'signin' ? 'active' : ''}`} onClick={() => setMode('signin')}>Sign in</button>
        <button className={`mode-btn ${mode === 'signup' ? 'active' : ''}`} onClick={() => setMode('signup')}>Sign up</button>
      </div>
      <form className="section auth-form" onSubmit={handleEmailAuth}>
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
