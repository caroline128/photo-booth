// Persistent state: tokens in the wallet, sound settings and the photo wall.
// Everything is wrapped in try/catch because storage can be unavailable
// (private windows, blocked site data); the app must still work without it.

import { Emitter } from './util.js';

const KEY = 'kacha-photo-shop:v1';
const DEFAULTS = { tokens: 12, sfx: true, voice: true, bgm: true, served: 0 };

class Store extends Emitter {
  constructor() {
    super();
    this.state = { ...DEFAULTS };
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) Object.assign(this.state, JSON.parse(raw));
    } catch {
      /* storage unavailable — keep defaults */
    }
  }
  get(k) {
    return this.state[k];
  }
  set(k, v) {
    this.state[k] = v;
    this._save();
    this.emit('change', k, v);
    this.emit(`change:${k}`, v);
  }
  _save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.state));
    } catch {
      /* ignore */
    }
  }
  spend(n) {
    if (this.state.tokens < n) return false;
    this.set('tokens', this.state.tokens - n);
    return true;
  }
  earn(n) {
    this.set('tokens', this.state.tokens + n);
  }
  nextSerial() {
    const n = (this.state.served || 0) + 1;
    this.set('served', n);
    return n;
  }
}

export const store = new Store();

// ---------------------------------------------------------------------------
// Photo wall: prints the guest decided to pin up, kept in IndexedDB as blobs.

const DB_NAME = 'kacha-photo-wall';
let dbp = null;

function db() {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore('prints', { keyPath: 'id' });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } catch (e) {
      reject(e);
    }
  });
  return dbp;
}

async function tx(mode, fn) {
  const d = await db();
  return new Promise((resolve, reject) => {
    const t = d.transaction('prints', mode);
    const s = t.objectStore('prints');
    const r = fn(s);
    t.oncomplete = () => resolve(r?.result);
    t.onerror = () => reject(t.error);
  });
}

export const wall = {
  async add(entry) {
    try {
      await tx('readwrite', (s) => s.put(entry));
      store.emit('wall');
      return true;
    } catch {
      return false;
    }
  },
  async list() {
    try {
      const all = await tx('readonly', (s) => s.getAll());
      return (all || []).sort((a, b) => b.created - a.created);
    } catch {
      return [];
    }
  },
  async remove(id) {
    try {
      await tx('readwrite', (s) => s.delete(id));
      store.emit('wall');
    } catch {
      /* ignore */
    }
  },
};
