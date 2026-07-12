import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import { networkReducer } from './networkReducer';
import { initialNetworkState, type NetworkAction, type NetworkState } from './networkTypes';

interface NetworkContextValue {
  state: NetworkState;
  dispatch: Dispatch<NetworkAction>;
}

const NetworkContext = createContext<NetworkContextValue | null>(null);

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(networkReducer, initialNetworkState);
  return <NetworkContext.Provider value={{ state, dispatch }}>{children}</NetworkContext.Provider>;
}

export function useNetwork(): NetworkContextValue {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error('useNetwork must be used within a NetworkProvider');
  return ctx;
}
