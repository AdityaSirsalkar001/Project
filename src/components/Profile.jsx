import React from 'react';
import { useAuth } from '../lib/AuthProvider.jsx';
import AuthForm from './AuthForm.jsx';
import { usePersistentState } from '../lib/hooks.js';
import Analytics from './Analytics.jsx';

export default function Profile() {
  const { user, signOut } = useAuth();

  if (!user) {
    return <AuthForm />;
  }

  const email = user.email || (user.user_metadata && user.user_metadata.email) || '';
  const name = user.user_metadata?.full_name || user.user_metadata?.name || '';
  const [displayName, setDisplayName] = usePersistentState('profile:name', name || '');

  return (
    <div className="panel">
      <h3 className="panel-title">Profile</h3>
      <div className="section">
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <div className="avatar" aria-hidden="true">{(displayName || name || email || 'U').slice(0,1).toUpperCase()}</div>
          <div>
            <div><strong>{displayName || name || 'User'}</strong></div>
            <div className="small">{email}</div>
            <div className="small">User ID: {user.id}</div>
          </div>
        </div>
        <div className="settings-table" style={{ maxWidth: 580 }}>
          <div className="settings-row">
            <div className="settings-label">Display name</div>
            <div className="settings-control"><input className="input" placeholder="Your name" value={displayName} onChange={e => setDisplayName(e.target.value)} /></div>
          </div>
        </div>
        <div className="row">
          <button className="btn secondary" onClick={signOut}>Sign out</button>
        </div>
        <div className="panel">
          <h4 className="panel-title">Your analytics</h4>
          <Analytics />
        </div>
      </div>
    </div>
  );
}
