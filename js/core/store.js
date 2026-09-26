// Settings live in localStorage; finished prints live in IndexedDB so they
// survive reloads. Both are best-effort: private windows may refuse storage.

const PREFIX = 'claude-booth:';
const DEFAULTS = { sound: true, voice: false, serial: 0, model: 'sonnet', thinking: false };
const listeners = new Map();

function emit(type, payload) {
  for (const fn of listeners.get(type) || []) fn(payload);
}

export function subscribe(type, fn) {
  if (!listeners.has(type)) listeners.set(type, new Set());
  listeners.get(type).add(fn);
  return () => listeners.get(type).delete(fn);
}

export const settings = {
  get(key) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw == null ? DEFAULTS[key] : JSON.parse(raw);
    } catch {
      return DEFAULTS[key];
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* storage unavailable: keep going with defaults */
    }
    emit('setting', { key, value });
    emit(`setting:${key}`, value);
  },
  nextSerial() {
    const n = (Number(this.get('serial')) || 0) + 1;
    this.set('serial', n);
    return n;
  },
};

// ------------------------------------------------------------------ recents

const DB = 'claude-booth';
const STORE = 'prints';
let dbp = null;

function db() {
  if (!dbp)
    dbp = new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(new Error('no indexedDB'));
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  return dbp;
}

async function tx(mode, run) {
  const d = await db();
  return new Promise((resolve, reject) => {
    const t = d.transaction(STORE, mode);
    const result = run(t.objectStore(STORE));
    t.oncomplete = () => resolve(result?.result ?? result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

export const recents = {
  async add(rec) {
    const item = { id: `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, created: Date.now(), ...rec };
    await tx('readwrite', (s) => s.put(item));
    emit('recents');
    return item;
  },
  async list() {
    try {
      const all = await tx('readonly', (s) => s.getAll());
      return (all || []).sort((a, b) => b.created - a.created);
    } catch {
      return [];
    }
  },
  async get(id) {
    try {
      return await tx('readonly', (s) => s.get(id));
    } catch {
      return null;
    }
  },
  async remove(id) {
    await tx('readwrite', (s) => s.delete(id));
    emit('recents');
  },
};
