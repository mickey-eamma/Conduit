import type { AuthUser } from '../../domain/types';

/**
 * Soft, non-secure client-side gate — credentials live in this bundled source
 * and are visible to anyone who opens dev tools. It only keeps casual users
 * out, and is preserved exactly as the original intended (no hardening).
 */
export const BUILTIN_USERS: AuthUser[] = [
  { u: 'admin', p: 'conduit', role: 'admin' },
  { u: 'matt.tomerlin', p: 'Datapoint@123!', role: 'user' },
  { u: 'ryan.costello', p: 'Datapoint@123!', role: 'user' },
];

export const USERS_KEY = 'conduit:users';
export const AUTH_KEY = 'conduit:auth';

export function currentUsers(): AuthUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length) return arr;
    }
  } catch {
    /* fall through to built-ins */
  }
  return BUILTIN_USERS.map((x) => ({ ...x }));
}

export function saveUsers(arr: AuthUser[]): void {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(arr));
  } catch {
    /* best-effort */
  }
}

export function findUser(username: string): AuthUser | undefined {
  return currentUsers().find((x) => x.u === username);
}
