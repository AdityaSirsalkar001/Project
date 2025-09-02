import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getSupabase } from './supabaseClient.js';

const AuthContext = createContext({ user: null, loading: true });

const USERS_KEY = 'auth:users';
const CURRENT_KEY = 'auth:current';

function readUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch { return []; }
}
function writeUsers(users) {
  try { localStorage.setItem(USERS_KEY, JSON.stringify(users)); } catch {}
}
function readCurrent() {
  try { return JSON.parse(localStorage.getItem(CURRENT_KEY)) || null; } catch { return null; }
}
function writeCurrent(user) {
  try { localStorage.setItem(CURRENT_KEY, JSON.stringify(user)); } catch {}
}

export function AuthProvider({ children }) {
  const supabase = getSupabase();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const mode = supabase ? 'supabase' : 'local';

  useEffect(() => {
    if (mode === 'supabase') {
      let mounted = true;
      (async () => {
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        setUser(data.user || null);
        setLoading(false);
      })();
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
      });
      return () => { sub?.subscription?.unsubscribe?.(); mounted = false; };
    } else {
      setUser(readCurrent());
      setLoading(false);
    }
  }, [mode, supabase]);

  async function signIn(email, password) {
    if (mode === 'supabase') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return;
    }
    const users = readUsers();
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) throw new Error('Invalid credentials');
    const u = { id: found.id, email: found.email, user_metadata: { full_name: found.name || '' } };
    writeCurrent(u); setUser(u);
  }

  async function signUp(email, password) {
    if (mode === 'supabase') {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return;
    }
    const users = readUsers();
    if (users.some(u => u.email === email)) throw new Error('Email already registered');
    const newUser = { id: crypto.randomUUID(), email, password, name: '' };
    users.push(newUser); writeUsers(users);
    const u = { id: newUser.id, email: newUser.email, user_metadata: { full_name: '' } };
    writeCurrent(u); setUser(u);
  }

  async function signInWithGoogle() {
    if (mode === 'supabase') {
      const redirectTo = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
      if (error) throw error;
      return;
    }
    const u = { id: 'local-google-' + crypto.randomUUID(), email: 'google-user@local', user_metadata: { full_name: 'Google User' } };
    writeCurrent(u); setUser(u);
  }

  async function signOut() {
    if (mode === 'supabase') { await supabase.auth.signOut(); }
    writeCurrent(null); setUser(null);
  }

  const value = useMemo(() => ({ user, loading, mode, signIn, signUp, signOut, signInWithGoogle }), [user, loading, mode]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
