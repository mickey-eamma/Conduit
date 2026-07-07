export interface CrossingsState {
  selected: Set<string>;
  expanded: Record<string, boolean>;
  bboxOnly: boolean;
}

export const initialCrossingsState: CrossingsState = {
  selected: new Set(),
  expanded: {},
  bboxOnly: false,
};

export type CrossingsAction =
  | { type: 'TOGGLE_LINE'; code: string }
  | { type: 'SELECT_ALL'; codes: string[] }
  | { type: 'SELECT_NONE' }
  | { type: 'TOGGLE_EXPANDED'; id: string }
  | { type: 'SET_BBOX_ONLY'; value: boolean }
  | { type: 'PRUNE_SELECTED'; validCodes: Set<string> };

export function crossingsReducer(state: CrossingsState, action: CrossingsAction): CrossingsState {
  switch (action.type) {
    case 'TOGGLE_LINE': {
      const next = new Set(state.selected);
      if (next.has(action.code)) next.delete(action.code);
      else next.add(action.code);
      return { ...state, selected: next };
    }
    case 'SELECT_ALL':
      return { ...state, selected: new Set(action.codes) };
    case 'SELECT_NONE':
      return { ...state, selected: new Set() };
    case 'TOGGLE_EXPANDED':
      return { ...state, expanded: { ...state.expanded, [action.id]: !state.expanded[action.id] } };
    case 'SET_BBOX_ONLY':
      return { ...state, bboxOnly: action.value };
    case 'PRUNE_SELECTED': {
      let changed = false;
      const next = new Set(state.selected);
      for (const code of next) {
        if (!action.validCodes.has(code)) {
          next.delete(code);
          changed = true;
        }
      }
      return changed ? { ...state, selected: next } : state;
    }
    default:
      return state;
  }
}
