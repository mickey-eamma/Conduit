import { AppBar } from './features/app-shell/AppBar';
import { useClientManager } from './features/app-shell/useClientManager';
import { Toast } from './shared/ui/Toast';
import { AssetManagerPage } from './features/asset-manager/AssetManagerPage';
import { LoginOverlay } from './features/auth/LoginOverlay';
import { useAuth } from './features/auth/useAuth';
import { useUsersAdmin } from './features/auth/useUsersAdmin';
import { UsersModal } from './features/auth/UsersModal';
import { CrossingsPage } from './features/crossings/CrossingsPage';
import { MapBuilderPage } from './features/map-builder/MapBuilderPage';
import { NetworkDesignPage } from './features/network-design/NetworkDesignPage';
import { useNetwork } from './state/network/NetworkContext';
import { useUi } from './state/ui/UiContext';

function App() {
  const { state, dispatch } = useUi();
  const { state: network, dispatch: networkDispatch } = useNetwork();
  const showToast = (message: string) => dispatch({ type: 'SHOW_TOAST', message });
  const clientManager = useClientManager(network, networkDispatch, showToast);
  const auth = useAuth();
  const usersAdmin = useUsersAdmin(auth, showToast);

  return (
    <>
      <AppBar clientManager={clientManager} auth={auth} onOpenUsers={usersAdmin.open} />
      <Toast />
      {/* Asset Manager stays mounted (CSS-hidden, not unmounted) when switching to
          Builder/Crossings, matching the original's body-class display:none pattern —
          this is what makes useInvalidateOnVisible work when switching back. */}
      <div className="workspace" style={{ display: state.mainView === 'assets' ? 'flex' : 'none' }}>
        <AssetManagerPage />
      </div>
      <div style={{ display: state.mainView === 'builder' ? 'flex' : 'none', flex: 1, minHeight: 0 }}>
        <MapBuilderPage currentClient={clientManager.currentClient} persistCurrentClient={clientManager.persistCurrentClient} />
      </div>
      <div style={{ display: state.mainView === 'crossings' ? 'flex' : 'none', flex: 1, minHeight: 0 }}>
        <CrossingsPage />
      </div>
      <div style={{ display: state.mainView === 'networkdesign' ? 'flex' : 'none', flex: 1, minHeight: 0 }}>
        <NetworkDesignPage />
      </div>
      {usersAdmin.isOpen && <UsersModal admin={usersAdmin} />}
      {/* A soft, non-secure gate — the rest of the app stays mounted underneath, matching the original's full-screen overlay. */}
      {!auth.authUser && <LoginOverlay onLogin={auth.doLogin} />}
    </>
  );
}

export default App;
