// localStorage-backed mock datastore.
//
// This mirrors the shape of the Supabase tables defined in supabase/schema.sql
// so the app behaves identically whether it is running against real Supabase
// or this offline mock. Everything is namespaced under `symbiosys.*` keys and
// persists across reloads, which is exactly what the "History should never be
// lost" requirement needs during local/demo use.

const NS = 'symbiosys';

const TABLES = [
  'profiles',
  'bookmarks',
  'history',
  'quiz_attempts',
  'quiz_answers',
  'cert_tokens', // time-limited certificate download links (mock mode)
  'notifications',
  'downloads',
  'feedback',
  'activity_logs',
  'resource_overrides', // admin edits to resources / learning materials
  'categories_overrides',
];

function keyFor(table) {
  return `${NS}.${table}`;
}

function read(table) {
  try {
    const raw = localStorage.getItem(keyFor(table));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(table, rows) {
  localStorage.setItem(keyFor(table), JSON.stringify(rows));
}

// Deterministic-ish id generator that does not rely on Math.random being
// available in every environment. Good enough for a client-side mock.
let counter = 0;
function genId() {
  counter += 1;
  const t = new Date().getTime().toString(36);
  return `${t}-${counter.toString(36)}-${(performance.now() | 0).toString(36)}`;
}

export const mockStore = {
  tables: TABLES,
  genId,

  ensureSeeded() {
    for (const t of TABLES) {
      if (localStorage.getItem(keyFor(t)) === null) write(t, []);
    }
  },

  select(table, predicate) {
    const rows = read(table);
    return predicate ? rows.filter(predicate) : rows;
  },

  find(table, predicate) {
    return read(table).find(predicate) || null;
  },

  insert(table, row) {
    const rows = read(table);
    const record = {
      id: row.id || genId(),
      created_at: row.created_at || new Date().toISOString(),
      ...row,
    };
    rows.push(record);
    write(table, rows);
    return record;
  },

  update(table, predicate, patch) {
    const rows = read(table);
    let updated = null;
    for (let i = 0; i < rows.length; i += 1) {
      if (predicate(rows[i])) {
        rows[i] = { ...rows[i], ...patch, updated_at: new Date().toISOString() };
        updated = rows[i];
      }
    }
    write(table, rows);
    return updated;
  },

  remove(table, predicate) {
    const rows = read(table);
    const kept = rows.filter((r) => !predicate(r));
    write(table, kept);
    return rows.length - kept.length;
  },

  // Auth-specific storage (mock only — real Supabase manages this itself)
  _users: {
    all() {
      return read('_auth_users');
    },
    save(users) {
      write('_auth_users', users);
    },
  },
  _session: {
    get() {
      try {
        const raw = localStorage.getItem(`${NS}._session`);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    },
    set(session) {
      if (session) localStorage.setItem(`${NS}._session`, JSON.stringify(session));
      else localStorage.removeItem(`${NS}._session`);
    },
  },
};
