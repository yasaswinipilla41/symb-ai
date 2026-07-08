// Unified backend API.
//
// Every feature in the portal talks to THIS module, never directly to Supabase
// or localStorage. When VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set, the
// calls hit real Supabase; otherwise they hit the localStorage mock. The public
// surface (return shapes, method names) is identical either way, so no feature
// code needs to branch on the backend.
//
// Return convention mirrors Supabase: { data, error }.

import { supabase, isSupabaseConfigured, isBootstrapAdmin } from './supabaseClient';
import { mockStore } from './mockStore';
import { certificateId } from './certificates';

mockStore.ensureSeeded();

export const backendMode = isSupabaseConfigured ? 'supabase' : 'mock';

// --- tiny non-cryptographic hash for the MOCK backend only -----------------
// Real password security is handled by Supabase. This only stops passwords
// sitting in plaintext in localStorage during offline/demo use.
function mockHash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i += 1) h = (h * 33) ^ str.charCodeAt(i);
  return (h >>> 0).toString(16);
}

const listeners = new Set();
function emitAuth(event, session) {
  listeners.forEach((cb) => cb(event, session));
}

function sessionFromUser(user) {
  if (!user) return null;
  return {
    access_token: `mock-${user.id}`,
    user: { id: user.id, email: user.email, user_metadata: user.user_metadata || {} },
  };
}

// ===========================================================================
// AUTH
// ===========================================================================
export const auth = {
  async signUp({ email, password, fullName }) {
    email = email.trim().toLowerCase();
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      return { data, error };
    }
    // mock
    const users = mockStore._users.all();
    if (users.some((u) => u.email === email)) {
      return { data: null, error: { message: 'An account with this email already exists.' } };
    }
    const isAdmin = isBootstrapAdmin(email);
    const user = {
      id: mockStore.genId(),
      email,
      password_hash: mockHash(password),
      email_confirmed: true, // auto-confirm in mock
      created_at: new Date().toISOString(),
      user_metadata: { full_name: fullName },
    };
    users.push(user);
    mockStore._users.save(users);
    mockStore.insert('profiles', {
      user_id: user.id,
      email,
      full_name: fullName,
      role: isAdmin ? 'admin' : 'user',
      status: 'active',
      avatar_url: '',
      department: '',
      theme: 'system',
      language: 'en',
    });
    return { data: { user, session: null }, error: null };
  },

  // Google (Gmail) OAuth. Redirects the browser to Google, then back to
  // /auth/callback where the app finalises the session and routes by role.
  async signInWithGoogle() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { prompt: 'select_account' },
        },
      });
      return { data, error };
    }
    return {
      data: null,
      error: { message: 'Google sign-in needs Supabase. Add your keys to .env and restart.' },
    };
  },

  async signIn({ email, password }) {
    email = email.trim().toLowerCase();
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      return { data, error };
    }
    const users = mockStore._users.all();
    const user = users.find((u) => u.email === email);
    if (!user || user.password_hash !== mockHash(password)) {
      return { data: null, error: { message: 'Invalid email or password.' } };
    }
    const profile = mockStore.find('profiles', (p) => p.user_id === user.id);
    if (profile?.status === 'banned') {
      return { data: null, error: { message: 'This account has been banned. Contact an administrator.' } };
    }
    if (profile?.status === 'inactive') {
      return { data: null, error: { message: 'This account is deactivated. Contact an administrator.' } };
    }
    const session = sessionFromUser(user);
    mockStore._session.set(session);
    mockStore.insert('history', {
      user_id: user.id,
      type: 'login',
      title: 'Signed in',
      meta: {},
    });
    mockStore.insert('activity_logs', { user_id: user.id, action: 'login', detail: '' });
    emitAuth('SIGNED_IN', session);
    return { data: { user, session }, error: null };
  },

  async signOut() {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signOut();
      return { error };
    }
    const session = mockStore._session.get();
    if (session?.user) {
      mockStore.insert('history', { user_id: session.user.id, type: 'logout', title: 'Signed out', meta: {} });
      mockStore.insert('activity_logs', { user_id: session.user.id, action: 'logout', detail: '' });
    }
    mockStore._session.set(null);
    emitAuth('SIGNED_OUT', null);
    return { error: null };
  },

  async getSession() {
    if (isSupabaseConfigured) {
      const { data } = await supabase.auth.getSession();
      return { data, error: null };
    }
    return { data: { session: mockStore._session.get() }, error: null };
  },

  onAuthStateChange(callback) {
    if (isSupabaseConfigured) {
      const { data } = supabase.auth.onAuthStateChange((event, session) => callback(event, session));
      return () => data.subscription.unsubscribe();
    }
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  async resetPassword(email) {
    email = email.trim().toLowerCase();
    if (isSupabaseConfigured) {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      return { error };
    }
    const users = mockStore._users.all();
    if (!users.some((u) => u.email === email)) {
      // Do not leak whether the email exists.
      return { error: null };
    }
    return { error: null };
  },

  async updatePassword(newPassword) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      return { error };
    }
    const session = mockStore._session.get();
    if (!session?.user) return { error: { message: 'Not signed in.' } };
    const users = mockStore._users.all();
    const user = users.find((u) => u.id === session.user.id);
    if (user) {
      user.password_hash = mockHash(newPassword);
      mockStore._users.save(users);
    }
    return { error: null };
  },
};

// ===========================================================================
// PROFILES
// ===========================================================================
export const profiles = {
  async get(userId) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
      return { data, error };
    }
    return { data: mockStore.find('profiles', (p) => p.user_id === userId), error: null };
  },

  async update(userId, patch) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('profiles').update(patch).eq('user_id', userId).select().maybeSingle();
      return { data, error };
    }
    return { data: mockStore.update('profiles', (p) => p.user_id === userId, patch), error: null };
  },

  async list() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      return { data, error };
    }
    return { data: mockStore.select('profiles').sort((a, b) => (a.created_at < b.created_at ? 1 : -1)), error: null };
  },

  // --- admin operations ---------------------------------------------------
  setRole(userId, role) {
    return profiles.update(userId, { role });
  },

  setStatus(userId, status) {
    // status ∈ 'active' | 'inactive' | 'banned'
    return profiles.update(userId, { status });
  },

  async remove(userId) {
    if (isSupabaseConfigured) {
      // Fully delete the user via the admin-gated SECURITY DEFINER RPC. This
      // removes the auth.users row, which cascades to the profile and all of
      // their data. No service_role key is needed (see supabase/schema.sql).
      const { error } = await supabase.rpc('admin_delete_user', { target_id: userId });
      return { error };
    }
    mockStore.remove('profiles', (p) => p.user_id === userId);
    const users = mockStore._users.all().filter((u) => u.id !== userId);
    mockStore._users.save(users);
    return { error: null };
  },
};

// ===========================================================================
// GENERIC per-user collections (bookmarks, history, quiz, notifications…)
// ===========================================================================
function collection(table) {
  const missingCertIdColumn = (error) => (
    table === 'quiz_attempts'
    && error?.message
    && error.message.includes("'cert_id' column")
  );
  const withoutCertId = (row) => {
    const { cert_id, ...rest } = row;
    return rest;
  };

  return {
    async listForUser(userId) {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from(table).select('*').eq('user_id', userId).order('created_at', { ascending: false });
        return { data, error };
      }
      return {
        data: mockStore.select(table, (r) => r.user_id === userId).sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
        error: null,
      };
    },
    async listAll() {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
        return { data, error };
      }
      return { data: mockStore.select(table).sort((a, b) => (a.created_at < b.created_at ? 1 : -1)), error: null };
    },
    async insert(row) {
      if (isSupabaseConfigured) {
        let { data, error } = await supabase.from(table).insert(row).select().maybeSingle();
        if (missingCertIdColumn(error) && Object.prototype.hasOwnProperty.call(row, 'cert_id')) {
          ({ data, error } = await supabase.from(table).insert(withoutCertId(row)).select().maybeSingle());
        }
        return { data, error };
      }
      return { data: mockStore.insert(table, row), error: null };
    },
    async update(id, patch) {
      if (isSupabaseConfigured) {
        let { data, error } = await supabase.from(table).update(patch).eq('id', id).select().maybeSingle();
        if (missingCertIdColumn(error) && Object.prototype.hasOwnProperty.call(patch, 'cert_id')) {
          ({ data, error } = await supabase.from(table).update(withoutCertId(patch)).eq('id', id).select().maybeSingle());
        }
        return { data, error };
      }
      return { data: mockStore.update(table, (r) => r.id === id, patch), error: null };
    },
    async remove(id) {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from(table).delete().eq('id', id);
        return { error };
      }
      mockStore.remove(table, (r) => r.id === id);
      return { error: null };
    },
  };
}

export const bookmarks = {
  ...collection('bookmarks'),
  async toggle(userId, resourceName, resourceUrl) {
    const { data } = await bookmarks.listForUser(userId);
    const existing = (data || []).find((b) => b.resource_name === resourceName);
    if (existing) {
      await bookmarks.remove(existing.id);
      return { data: null, removed: true };
    }
    const res = await bookmarks.insert({ user_id: userId, resource_name: resourceName, resource_url: resourceUrl });
    return { data: res.data, removed: false };
  },
};

export const history = {
  ...collection('history'),
  async log(userId, type, title, meta = {}) {
    return history.insert({ user_id: userId, type, title, meta });
  },
};

export const quizAttempts = collection('quiz_attempts');
export const notifications = {
  ...collection('notifications'),
  async broadcast(title, body) {
    // For mock: a single broadcast row with user_id = '*'
    return notifications.insert({ user_id: '*', title, body, read: false });
  },
};
export const feedback = collection('feedback');
export const downloads = collection('downloads');
export const activityLogs = collection('activity_logs');

// ===========================================================================
// CATALOG CONTENT: categories + resources
// Public-read / admin-write tables (see supabase/schema.sql RLS). These hold
// admin additions and overrides layered on top of the static src/data catalog.
// ===========================================================================
function publicContent(table) {
  return {
    async list() {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .order('created_at', { ascending: true });
        return { data, error };
      }
      return {
        data: mockStore.select(table).sort((a, b) => (a.created_at > b.created_at ? 1 : -1)),
        error: null,
      };
    },
    async insert(row) {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from(table).insert(row).select().maybeSingle();
        return { data, error };
      }
      return { data: mockStore.insert(table, row), error: null };
    },
    async update(id, patch) {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from(table).update(patch).eq('id', id).select().maybeSingle();
        return { data, error };
      }
      return { data: mockStore.update(table, (r) => r.id === id, patch), error: null };
    },
    async remove(id) {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from(table).delete().eq('id', id);
        return { error };
      }
      mockStore.remove(table, (r) => r.id === id);
      return { error: null };
    },
    async removeWhere(predicate, matchColumn, matchValue) {
      // predicate is only used for the mock path; Supabase uses column match.
      if (isSupabaseConfigured) {
        const { error } = await supabase.from(table).delete().eq(matchColumn, matchValue);
        return { error };
      }
      mockStore.remove(table, predicate);
      return { error: null };
    },
  };
}

export const resourcesApi = publicContent('resources');
export const categoriesApi = publicContent('categories');

export const certificatesApi = {
  async verify(certId) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.rpc('get_public_certificate', { p_cert_id: certId });
      return { data, error };
    }
    // Mock backend fallback
    const attempts = mockStore.select('quiz_attempts', (a) => (
      (a.cert_id || certificateId(a.user_id, a.resource_name)) === certId
    ) && Number(a.percentage) >= 70);
    if (!attempts.length) return { data: null, error: null };
    const attempt = attempts.sort((a, b) => b.percentage - a.percentage)[0];
    const profile = mockStore.find('profiles', (p) => p.user_id === attempt.user_id);
    return {
      data: {
        id: attempt.cert_id || certificateId(attempt.user_id, attempt.resource_name),
        resource_name: attempt.resource_name,
        percentage: attempt.percentage,
        created_at: attempt.created_at,
        student_name: profile?.full_name || profile?.email || 'Student',
        cert_status: attempt.cert_status,
      },
      error: null,
    };
  }
};
