import React from 'react';
import { useAuth } from '../lib/AuthProvider.jsx';
import AuthForm from './AuthForm.jsx';

export default function Profile() {
  const { user, signOut } = useAuth();

  if (!user) {
    return <AuthForm />;
  }

  const email = user.email || (user.user_metadata && user.user_metadata.email) || '';
  const name = user.user_metadata?.full_name || user.user_metadata?.name || '';

  return (
    <div className="panel">
      <h3 className="panel-title">Profile</h3>
      <div className="section">
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <div className="avatar" aria-hidden="true">{(name || email || 'U').slice(0,1).toUpperCase()}</div>
          <div>
            <div><strong>{name || 'User'}</strong></div>
            <div className="small">{email}</div>
            <div className="small">User ID: {user.id}</div>
          </div>
        </div>
        <div className="row">
          <button className="btn secondary" onClick={signOut}>Sign out</button>
        </div>
      </div>
    </div>
  );
}
