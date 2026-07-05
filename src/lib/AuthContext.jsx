// Auth context — the single source of truth for "who is signed in and what
// can they do". Wraps the backend adapter so components never touch Supabase
// or the mock directly. Exposes the current user, their profile (which carries
// the role: 'user' | 'admin'), and the auth actions.

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth, profiles, backendMode } from './backend';
import { isBootstrapAdmin } from './supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (u) => {
    if (!u) {
      setProfile(null);
      return;
    }
    let { data } = await profiles.get(u.id);
    // Safety net: guarantee the configured bootstrap emails are admins even if
    // the DB trigger hasn't promoted them yet (e.g. account created before the
    // email was added to the list). The schema is the primary source of truth.
    if (data && data.role !== 'admin' && isBootstrapAdmin(u.email || data.email)) {
      const { data: promoted } = await profiles.update(u.id, { role: 'admin' });
      if (promoted) data = promoted;
    }
    setProfile(data || null);
  }, []);

  const applySession = useCallback(
    async (session) => {
      const u = session?.user || null;
      setUser(u);
      await loadProfile(u);
    },
    [loadProfile]
  );

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await auth.getSession();
      if (!active) return;
      await applySession(data?.session);
      setLoading(false);
    })();

    const unsubscribe = auth.onAuthStateChange(async (_event, session) => {
      await applySession(session);
    });
    return () => {
      active = false;
      unsubscribe && unsubscribe();
    };
  }, [applySession]);

  const signIn = useCallback(async (creds) => {
    const res = await auth.signIn(creds);
    if (!res.error && res.data?.session) await applySession(res.data.session);
    return res;
  }, [applySession]);

  const signUp = useCallback((creds) => auth.signUp(creds), []);

  const signInWithGoogle = useCallback(() => auth.signInWithGoogle(), []);

  const signOut = useCallback(async () => {
    await auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(() => loadProfile(user), [loadProfile, user]);

  const value = {
    user,
    profile,
    role: profile?.role || (user ? 'user' : null),
    isAdmin: profile?.role === 'admin',
    isAuthenticated: Boolean(user),
    loading,
    backendMode,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword: auth.resetPassword,
    updatePassword: auth.updatePassword,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
