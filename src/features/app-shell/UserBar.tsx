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
      <span className="ub-name">
        {username} · {isAdmin ? 'Admin' : 'User'}
      </span>
      {isAdmin && (
        <button type="button" className="btn cb-btn" onClick={onOpenUsers}>
          Users
        </button>
      )}
      <button type="button" className="btn cb-btn" onClick={onSignOut}>
        Sign out
      </button>
    </div>
  );
}
