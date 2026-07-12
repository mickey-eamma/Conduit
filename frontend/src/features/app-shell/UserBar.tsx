import { DropdownMenu } from '../../shared/ui/DropdownMenu';

interface UserBarProps {
  username: string | null;
  isAdmin: boolean;
  onOpenUsers: () => void;
  onSignOut: () => void;
}

export function UserBar({ username, isAdmin, onOpenUsers, onSignOut }: UserBarProps) {
  if (!username) return <div className="user-bar" hidden />;

  return (
    <div className="user-bar">
      <DropdownMenu trigger={<span className="ub-name">{`${username} · ${isAdmin ? 'Admin' : 'User'}`}</span>}>
        {isAdmin && (
          <button type="button" className="menu-item" onClick={onOpenUsers}>
            Users
          </button>
        )}
        <button type="button" className="menu-item" onClick={onSignOut}>
          Sign out
        </button>
      </DropdownMenu>
    </div>
  );
}
