import type { UiAction, UiState } from './uiTypes';

let toastId = 0;

export function uiReducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case 'SET_MAIN_VIEW':
      return { ...state, mainView: action.view };
    case 'SET_ACTIVE_VIEW':
      return { ...state, activeView: action.view };
    case 'SET_UTIL':
      return { ...state, selectedUtil: action.util, selectedFeatureId: null };
    case 'SET_TOOL':
      return { ...state, tool: action.tool };
    case 'TOGGLE_SNAP':
      return { ...state, snapEnabled: !state.snapEnabled };
    case 'SELECT_FEATURE':
      return { ...state, selectedFeatureId: action.id };
    case 'DESELECT':
      return { ...state, selectedFeatureId: null };
    case 'SHOW_TOAST':
      return { ...state, toast: { id: ++toastId, message: action.message } };
    case 'DISMISS_TOAST':
      return { ...state, toast: null };
    default:
      return state;
  }
}
