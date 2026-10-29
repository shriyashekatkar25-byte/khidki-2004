/**
 * Local-first persistence. Everything lives in the visitor's own browser.
 * The KV interface is injected so tests can use an in-memory store and the
 * app degrades to memory when localStorage throws (private mode, blocked).
 */

export interface KV {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

export class MemoryKV implements KV {
  private m = new Map<string, string>();
  get(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  set(k: string, v: string) { this.m.set(k, v); }
  remove(k: string) { this.m.delete(k); }
}

/** localStorage with a silent in-memory fallback. `persistent` tells the UI which one it got. */
export function browserKV(): KV & { persistent: boolean } {
  const mem = new MemoryKV();
  try {
    const probe = '__khidki_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return {
      persistent: true,
      get: (k) => { try { return window.localStorage.getItem(k); } catch { return mem.get(k); } },
      set: (k, v) => { try { window.localStorage.setItem(k, v); } catch { mem.set(k, v); } },
      remove: (k) => { try { window.localStorage.removeItem(k); } catch { mem.remove(k); } },
    };
  } catch {
    return { persistent: false, get: (k) => mem.get(k), set: (k, v) => mem.set(k, v), remove: (k) => mem.remove(k) };
  }
}

const PREFIX = 'khidki2004:';

/** Versioned JSON document store on top of a KV. Corrupt or foreign data falls back to the default. */
export class Store {
  constructor(private kv: KV) {}

  read<T>(key: string, fallback: T, version = 1): T {
    const raw = this.kv.get(PREFIX + key);
    if (raw == null) return fallback;
    try {
      const doc = JSON.parse(raw) as { v: number; data: T };
      if (!doc || typeof doc !== 'object' || doc.v !== version) return fallback;
      return doc.data;
    } catch {
      return fallback;
    }
  }

  write<T>(key: string, data: T, version = 1) {
    this.kv.set(PREFIX + key, JSON.stringify({ v: version, data }));
  }

  clear(key: string) { this.kv.remove(PREFIX + key); }
}
