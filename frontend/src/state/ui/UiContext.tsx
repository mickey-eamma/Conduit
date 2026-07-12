import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import { uiReducer } from './uiReducer';
import { initialUiState, type UiAction, type UiState } from './uiTypes';

interface UiContextValue {
  state: UiState;
  dispatch: Dispatch<UiAction>;
}

const UiContext = createContext<UiContextValue | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(uiReducer, initialUiState);
  return <UiContext.Provider value={{ state, dispatch }}>{children}</UiContext.Provider>;
}

export function useUi(): UiContextValue {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error('useUi must be used within a UiProvider');
  return ctx;
}
