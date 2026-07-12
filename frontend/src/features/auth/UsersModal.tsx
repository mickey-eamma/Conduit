import { useState } from 'react';
import { Modal } from '../../shared/ui/Modal';
import type { UseUsersAdminResult } from './useUsersAdmin';

interface UsersModalProps {
  admin: UseUsersAdminResult;
}

export function UsersModal({ admin }: UsersModalProps) {
  const [newUser, setNewUser] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');

  function handleAdd() {
    admin.addUser(newUser.trim(), newPass, newRole);
    setNewUser('');
    setNewPass('');
  }

  return (
    <Modal className="users-modal" onClose={admin.close}>
      <div className="users-dialog" onPointerDown={(e) => e.stopPropagation()}>
        <div className="users-head">
          <div>
            <div className="t">Users</div>
            <div className="s">Manage who can sign in. Changes save in this browser.</div>
          </div>
          <button className="x" onClick={admin.close}>
            &times;
          </button>
        </div>
        <div className="users-body">
          {admin.users.length ? (
            admin.users.map((x, i) => (
              <div className="urow" key={i}>
                <input className="uu" value={x.u} placeholder="username" onChange={(e) => admin.updateUser(i, 'u', e.target.value.trim())} />
                <input className="up" value={x.p} placeholder="password" onChange={(e) => admin.updateUser(i, 'p', e.target.value)} />
                <select className="ur" value={x.role} onChange={(e) => admin.updateUser(i, 'role', e.target.value)}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <button className="btn danger urdel" title="Remove" onClick={() => admin.deleteUser(i)}>
                  &times;
                </button>
              </div>
            ))
          ) : (
            <p className="auth-note">No users — add one below (you’ll need an admin to sign in).</p>
          )}
        </div>
        <div className="users-add">
          <input
            id="nuUser"
            placeholder="New username"
            autoComplete="off"
            value={newUser}
            onChange={(e) => setNewUser(e.target.value)}
          />
          <input id="nuPass" placeholder="Password" autoComplete="off" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
          <select id="nuRole" value={newRole} onChange={(e) => setNewRole(e.target.value as 'user' | 'admin')}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button className="btn" id="nuAdd" onClick={handleAdd}>
            Add user
          </button>
        </div>
        <div className="users-foot">
          <span className="sp">
            To make these the built-in defaults (shared across browsers), Copy for HTML and paste into the{' '}
            <code>BUILTIN_USERS</code> list in <code>src/features/auth/users.ts</code>.
          </span>
          <button className="btn" onClick={admin.copyForHtml}>
            Copy for HTML
          </button>
          <button className="btn danger" onClick={admin.resetUsers}>
            Reset
          </button>
        </div>
      </div>
    </Modal>
  );
}
