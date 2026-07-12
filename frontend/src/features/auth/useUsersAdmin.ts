import { useState } from 'react';
import type { AuthUser } from '../../domain/types';
import { USERS_KEY, currentUsers, saveUsers } from './users';
import type { UseAuthResult } from './useAuth';

export interface UseUsersAdminResult {
  isOpen: boolean;
  users: AuthUser[];
  open: () => void;
  close: () => void;
  updateUser: (i: number, key: 'u' | 'p' | 'role', value: string) => void;
  addUser: (u: string, p: string, role: AuthUser['role']) => void;
  deleteUser: (i: number) => void;
  copyForHtml: () => void;
  resetUsers: () => void;
}

/** The admin-only Users modal: add/edit/remove built-in accounts, all stored in localStorage. Mirrors the original's `openUsers`/`renderUsers`/`updateUser`/`addUser`/`delUser`/`copyUsersForHtml`/`resetUsers`. */
export function useUsersAdmin(auth: UseAuthResult, onToast: (message: string) => void): UseUsersAdminResult {
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<AuthUser[]>(() => currentUsers());

  function open(): void {
    if (!auth.isAdmin) return;
    setUsers(currentUsers());
    setIsOpen(true);
  }

  function close(): void {
    setIsOpen(false);
  }

  function persist(next: AuthUser[]): void {
    setUsers(next);
    saveUsers(next);
  }

  function updateUser(i: number, key: 'u' | 'p' | 'role', value: string): void {
    persist(users.map((u, idx) => (idx === i ? { ...u, [key]: value } : u)));
    auth.refreshAuthedUser();
  }

  function addUser(u: string, p: string, role: AuthUser['role']): void {
    if (!u || !p) {
      onToast('Enter a username and a password.');
      return;
    }
    if (users.some((x) => x.u === u)) {
      onToast('That username already exists.');
      return;
    }
    persist([...users, { u, p, role }]);
    onToast(`Added user "${u}".`);
  }

  function deleteUser(i: number): void {
    const x = users[i];
    if (!x) return;
    if (x.role === 'admin' && users.filter((a) => a.role === 'admin').length <= 1) {
      onToast('Keep at least one admin account.');
      return;
    }
    if (!window.confirm(`Remove user "${x.u}"?`)) return;
    persist(users.filter((_, idx) => idx !== i));
    if (auth.authUser && auth.authUser.u === x.u) auth.signOut();
  }

  function copyForHtml(): void {
    const code = `const USERS=[\n${users
      .map((x) => `  {u:${JSON.stringify(x.u)}, p:${JSON.stringify(x.p)}, role:${JSON.stringify(x.role || 'user')}}`)
      .join(',\n')}\n];`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(code).then(
        () => onToast('Copied the USERS array — paste it over BUILTIN_USERS in src/features/auth/users.ts.'),
        () => onToast('Copy failed — select and copy manually.'),
      );
    } else {
      onToast('Clipboard unavailable in this browser.');
    }
  }

  function resetUsers(): void {
    if (!window.confirm('Reset users to the built-in list defined in the app?')) return;
    try {
      localStorage.removeItem(USERS_KEY);
    } catch {
      /* best-effort */
    }
    setUsers(currentUsers());
    onToast('Reset to the built-in users.');
  }

  return { isOpen, users, open, close, updateUser, addUser, deleteUser, copyForHtml, resetUsers };
}
