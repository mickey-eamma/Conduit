import { useEffect, useState } from 'react';
import type { AuthUser } from '../../domain/types';
import { AUTH_KEY, currentUsers, findUser } from './users';

export interface UseAuthResult {
  authUser: AuthUser | null;
  isAdmin: boolean;
  doLogin: (username: string, password: string) => string | null;
  signOut: () => void;
  refreshAuthedUser: () => void;
}

/** Session-restore (sessionStorage, not localStorage — a fresh browser tab always re-prompts) + login/sign-out, mirroring the original's `initAuth`/`doLogin`/`setAuthed`/`signOut`. */
export function useAuth(): UseAuthResult {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const savedUsername = sessionStorage.getItem(AUTH_KEY);
    const rec = savedUsername ? findUser(savedUsername) : undefined;
    if (rec) setAuthUser(rec);
  }, []);

  function doLogin(username: string, password: string): string | null {
    const rec = currentUsers().find((x) => x.u === username && x.p === password);
    if (!rec) return 'Incorrect username or password.';
    sessionStorage.setItem(AUTH_KEY, rec.u);
    setAuthUser(rec);
    return null;
  }

  function signOut(): void {
    setAuthUser(null);
    sessionStorage.removeItem(AUTH_KEY);
  }

  function refreshAuthedUser(): void {
    if (!authUser) return;
    const me = findUser(authUser.u);
    if (me) setAuthUser(me);
  }

  return { authUser, isAdmin: !!authUser && authUser.role === 'admin', doLogin, signOut, refreshAuthedUser };
}
