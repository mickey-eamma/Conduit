import { MainTabs } from './MainTabs';
import { ClientBar } from './ClientBar';
import { UserBar } from './UserBar';
import { useUi } from '../../state/ui/UiContext';
import type { UseClientManagerResult } from './useClientManager';
import type { UseAuthResult } from '../auth/useAuth';

interface AppBarProps {
  clientManager: UseClientManagerResult;
  auth: UseAuthResult;
  onOpenUsers: () => void;
}

export function AppBar({ clientManager, auth, onOpenUsers }: AppBarProps) {
  const { state, dispatch } = useUi();

  return (
    <header className="app-bar">
      <div className="brand">
        <span className="mark" />
        <span className="nm">Conduit</span>
        <span className="sub">Utility network mapping</span>
      </div>
      <MainTabs active={state.mainView} onChange={(view) => dispatch({ type: 'SET_MAIN_VIEW', view })} />
      <div className="app-actions">
        <ClientBar
          clientNames={clientManager.clientNames}
          currentClient={clientManager.currentClient}
          onSelect={clientManager.selectClient}
          onSave={clientManager.saveClient}
          onNew={clientManager.newClient}
          onRename={clientManager.renameClient}
          onDelete={clientManager.deleteClient}
        />
        <UserBar username={auth.authUser?.u ?? null} isAdmin={auth.isAdmin} onOpenUsers={onOpenUsers} onSignOut={auth.signOut} />
      </div>
    </header>
  );
}
