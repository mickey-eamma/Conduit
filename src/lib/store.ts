/**
 * Three-tier persistence: an optional host-injected `window.storage` API
 * first (looks like a leftover from whatever sandbox originally hosted this
 * app), falling back to localStorage, falling back to an in-memory object
 * so the app still works if both are unavailable. Ported near-verbatim —
 * already framework-agnostic in the original.
 */
interface HostStorage {
  get?(key: string): Promise<{ value: string } | null>;
  set?(key: string, value: string): Promise<void>;
}

declare global {
  interface Window {
    storage?: HostStorage;
  }
}

const mem: Record<string, string> = {};

export const Store = {
  async get(key: string): Promise<string | null> {
    try {
      if (window.storage?.get) {
        const r = await window.storage.get(key);
        return r ? r.value : null;
      }
    } catch {
      /* fall through */
    }
    try {
      const v = localStorage.getItem(key);
      if (v != null) return v;
    } catch {
      /* fall through */
    }
    return mem[key] ?? null;
  },

  async set(key: string, value: string): Promise<true> {
    try {
      if (window.storage?.set) {
        await window.storage.set(key, value);
        return true;
      }
    } catch {
      /* fall through */
    }
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      /* fall through */
    }
    mem[key] = value;
    return true;
  },
};
