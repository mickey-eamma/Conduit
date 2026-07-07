import type { ToolId, UtilId } from '../../domain/types';

export type MainView = 'assets' | 'crossings' | 'builder';
export type ActiveView = 'map' | 'dashboard';

export interface ToastState {
  id: number;
  message: string;
}

export interface UiState {
  mainView: MainView;
  activeView: ActiveView;
  selectedUtil: UtilId;
  tool: ToolId;
  snapEnabled: boolean;
  selectedFeatureId: string | null;
  toast: ToastState | null;
}

export type UiAction =
  | { type: 'SET_MAIN_VIEW'; view: MainView }
  | { type: 'SET_ACTIVE_VIEW'; view: ActiveView }
  | { type: 'SET_UTIL'; util: UtilId }
  | { type: 'SET_TOOL'; tool: ToolId }
  | { type: 'TOGGLE_SNAP' }
  | { type: 'SELECT_FEATURE'; id: string | null }
  | { type: 'DESELECT' }
  | { type: 'SHOW_TOAST'; message: string }
  | { type: 'DISMISS_TOAST' };

export const initialUiState: UiState = {
  mainView: 'assets',
  activeView: 'map',
  selectedUtil: 'telecom',
  tool: 'pan',
  snapEnabled: true,
  selectedFeatureId: null,
  toast: null,
};
