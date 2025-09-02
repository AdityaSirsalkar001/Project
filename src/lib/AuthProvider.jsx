import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getSupabase } from './supabaseClient.js';

const AuthContext = createContext({ user: null, loading: true });

export function AuthProvider({ children }) {
  const supabase = getSupabase();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!supabase);

  useEffect(() => {
    if (!supabase) { setUser(null); setLoading(false); return; }
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
  }, [supabase]);

  const value = useMemo(() => ({ user, loading, supabase }), [user, loading, supabase]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
