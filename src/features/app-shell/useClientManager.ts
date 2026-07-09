import { useEffect, useRef, useState, type Dispatch } from 'react';
import { MODES } from '../../domain/constants';
import { defaultProject } from '../../lib/geojsonProject';
import { deserializeProject, loadClients, persistClients, serializeProject, LAST_KEY, type SerializedProject } from '../../lib/persistence';
import { Store } from '../../lib/store';
import { initialNetworkState, type NetworkAction, type NetworkState } from '../../state/network/networkTypes';

export interface UseClientManagerResult {
  clientNames: string[];
  currentClient: string | null;
  selectClient: (name: string) => void;
  saveClient: () => void;
  saveClientAs: () => void;
  newClient: () => void;
  renameClient: () => void;
  deleteClient: () => void;
  /** Persists current geometry to the selected client without a toast — used by Deploy, which has its own status message. */
  persistCurrentClient: () => Promise<void>;
}

function hasAnyFeatures(network: NetworkState): boolean {
  return MODES.some((id) => network.networks[id].features.length > 0);
}

/**
 * Client/project switching: named saved projects in localStorage (via
 * Store), with the same native confirm()/prompt() flows and last-used-client
 * auto-restore as the original app. Orchestrates NetworkContext (dispatches
 * LOAD_PROJECT/RESET_PROJECT) but doesn't own the network data itself.
 */
export function useClientManager(
  network: NetworkState,
  networkDispatch: Dispatch<NetworkAction>,
  onToast: (message: string) => void,
): UseClientManagerResult {
  const [clients, setClients] = useState<Record<string, SerializedProject>>({});
  const [currentClient, setCurrentClient] = useState<string | null>(null);
  const networkRef = useRef(network);
  networkRef.current = network;
  const initedRef = useRef(false);

  useEffect(() => {
    if (initedRef.current) return;
    initedRef.current = true;
    (async () => {
      const loaded = await loadClients();
      const last = await Store.get(LAST_KEY);
      if (last && loaded[last]) {
        setCurrentClient(last);
        const { uid, networks } = deserializeProject(loaded[last]);
        networkDispatch({ type: 'LOAD_PROJECT', uid, networks });
      } else {
        const def = defaultProject();
        if (def) {
          const { uid, networks } = deserializeProject(def);
          networkDispatch({ type: 'LOAD_PROJECT', uid, networks });
        }
      }
      setClients(loaded);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount
  }, []);

  async function selectClient(name: string) {
    if (!name) {
      setCurrentClient(null);
      await Store.set(LAST_KEY, '');
      return;
    }
    if (!clients[name]) return;
    if (hasAnyFeatures(networkRef.current) && currentClient !== name) {
      if (!window.confirm(`Load client "${name}"? Any unsaved changes to the current map will be lost.`)) return;
    }
    const { uid, networks } = deserializeProject(clients[name]);
    networkDispatch({ type: 'LOAD_PROJECT', uid, networks });
    setCurrentClient(name);
    await Store.set(LAST_KEY, name);
    onToast(`Loaded "${name}"`);
  }

  async function saveClient() {
    if (!currentClient) return saveClientAs();
    const loaded = await loadClients();
    loaded[currentClient] = { ...serializeProject(networkRef.current), savedAt: Date.now() };
    await persistClients(loaded);
    setClients(loaded);
    onToast(`Saved "${currentClient}"`);
  }

  async function persistCurrentClient() {
    if (!currentClient) return;
    const loaded = await loadClients();
    loaded[currentClient] = { ...serializeProject(networkRef.current), savedAt: Date.now() };
    await persistClients(loaded);
    setClients(loaded);
  }

  async function saveClientAs() {
    const name = (window.prompt('Save current map as client:') || '').trim();
    if (!name) return;
    const loaded = await loadClients();
    if (loaded[name] && !window.confirm(`Client "${name}" exists. Overwrite it with the current map?`)) return;
    loaded[name] = { ...serializeProject(networkRef.current), savedAt: Date.now() };
    await persistClients(loaded);
    setCurrentClient(name);
    await Store.set(LAST_KEY, name);
    setClients(loaded);
    onToast(`Saved as "${name}"`);
  }

  async function newClient() {
    if (
      hasAnyFeatures(networkRef.current) &&
      !window.confirm('Start a new blank client? The current map will be cleared (save it first if you want to keep it).')
    ) {
      return;
    }
    const name = (window.prompt('New client name:') || '').trim();
    if (!name) return;
    const loaded = await loadClients();
    if (loaded[name] && !window.confirm(`Client "${name}" already exists. Replace it with a blank project?`)) return;
    networkDispatch({ type: 'RESET_PROJECT' });
    loaded[name] = { ...serializeProject(initialNetworkState), savedAt: Date.now() };
    await persistClients(loaded);
    setCurrentClient(name);
    await Store.set(LAST_KEY, name);
    setClients(loaded);
    onToast(`New client "${name}"`);
  }

  async function renameClient() {
    if (!currentClient) {
      onToast('Select a client to rename');
      return;
    }
    const next = (window.prompt('Rename client:', currentClient) || '').trim();
    if (!next || next === currentClient) return;
    const loaded = await loadClients();
    if (!loaded[currentClient]) {
      onToast('Save the client first');
      return;
    }
    if (loaded[next] && !window.confirm(`Client "${next}" already exists. Overwrite it?`)) return;
    loaded[next] = loaded[currentClient];
    delete loaded[currentClient];
    await persistClients(loaded);
    const was = currentClient;
    setCurrentClient(next);
    await Store.set(LAST_KEY, next);
    setClients(loaded);
    onToast(`Renamed "${was}" → "${next}"`);
  }

  async function deleteClient() {
    if (!currentClient) {
      onToast('No client selected');
      return;
    }
    if (!window.confirm(`Delete client "${currentClient}"? This removes its saved networks.`)) return;
    const loaded = await loadClients();
    delete loaded[currentClient];
    await persistClients(loaded);
    const was = currentClient;
    setCurrentClient(null);
    await Store.set(LAST_KEY, '');
    setClients(loaded);
    onToast(`Deleted "${was}"`);
  }

  return {
    clientNames: Object.keys(clients).sort((a, b) => a.localeCompare(b)),
    currentClient,
    selectClient,
    saveClient,
    saveClientAs,
    newClient,
    renameClient,
    deleteClient,
    persistCurrentClient,
  };
}
