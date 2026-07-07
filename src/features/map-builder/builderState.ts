import { ORDER, WIDGET_DEFS, defaultLayerCfg } from '../../domain/constants';
import type { BasemapId, BuilderLayerCfg, UtilId, Widget } from '../../domain/types';

const FONT_MIN = 10;
const FONT_MAX = 48;

export interface BuilderState {
  layers: Record<UtilId, BuilderLayerCfg>;
  expandedLayers: Record<UtilId, boolean>;
  widgets: Widget[];
  nextWidgetId: number;
  basemap: BasemapId;
}

function initialLayers(): Record<UtilId, BuilderLayerCfg> {
  const layers = {} as Record<UtilId, BuilderLayerCfg>;
  for (const id of ORDER) layers[id] = defaultLayerCfg(id);
  return layers;
}

function initialExpanded(): Record<UtilId, boolean> {
  const expanded = {} as Record<UtilId, boolean>;
  for (const id of ORDER) expanded[id] = false;
  return expanded;
}

export const initialBuilderState: BuilderState = {
  layers: initialLayers(),
  expandedLayers: initialExpanded(),
  widgets: [],
  nextWidgetId: 1,
  basemap: 'gray',
};

export type BuilderAction =
  | { type: 'SET_LAYER_VISIBLE'; util: UtilId; visible: boolean }
  | { type: 'TOGGLE_LAYER_EXPANDED'; util: UtilId }
  | { type: 'SET_LAYER_COLOR'; util: UtilId; color: string }
  | { type: 'SET_LAYER_WEIGHT'; util: UtilId; weight: number }
  | { type: 'SET_LAYER_OPACITY'; util: UtilId; opacity: number }
  | { type: 'SET_POPUP_ENABLED'; util: UtilId; enabled: boolean }
  | { type: 'SET_POPUP_FIELD'; util: UtilId; field: keyof BuilderLayerCfg['popup']['fields']; value: boolean }
  | { type: 'SET_BASEMAP'; basemap: BasemapId }
  | { type: 'ADD_WIDGET'; widgetType: Widget['type']; x: number | null; y: number | null }
  | { type: 'REMOVE_WIDGET'; id: string }
  | { type: 'MOVE_WIDGET'; id: string; x: number; y: number }
  | { type: 'SET_WIDGET_TEXT'; id: string; text: string }
  | { type: 'ADJUST_WIDGET_FONT_SIZE'; id: string; delta: number };

export function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case 'SET_LAYER_VISIBLE':
      return { ...state, layers: { ...state.layers, [action.util]: { ...state.layers[action.util], visible: action.visible } } };
    case 'TOGGLE_LAYER_EXPANDED':
      return { ...state, expandedLayers: { ...state.expandedLayers, [action.util]: !state.expandedLayers[action.util] } };
    case 'SET_LAYER_COLOR':
      return { ...state, layers: { ...state.layers, [action.util]: { ...state.layers[action.util], color: action.color } } };
    case 'SET_LAYER_WEIGHT':
      return { ...state, layers: { ...state.layers, [action.util]: { ...state.layers[action.util], weight: action.weight } } };
    case 'SET_LAYER_OPACITY':
      return { ...state, layers: { ...state.layers, [action.util]: { ...state.layers[action.util], opacity: action.opacity } } };
    case 'SET_POPUP_ENABLED':
      return {
        ...state,
        layers: {
          ...state.layers,
          [action.util]: { ...state.layers[action.util], popup: { ...state.layers[action.util].popup, enabled: action.enabled } },
        },
      };
    case 'SET_POPUP_FIELD':
      return {
        ...state,
        layers: {
          ...state.layers,
          [action.util]: {
            ...state.layers[action.util],
            popup: {
              ...state.layers[action.util].popup,
              fields: { ...state.layers[action.util].popup.fields, [action.field]: action.value },
            },
          },
        },
      };
    case 'SET_BASEMAP':
      return { ...state, basemap: action.basemap };
    case 'ADD_WIDGET': {
      if (WIDGET_DEFS[action.widgetType].single && state.widgets.some((w) => w.type === action.widgetType)) return state;
      const n = state.widgets.length;
      const widget: Widget = {
        id: `w${state.nextWidgetId}`,
        type: action.widgetType,
        x: action.x != null ? Math.min(0.97, Math.max(0, action.x)) : Math.min(0.6, 0.05 + (n % 6) * 0.04),
        y: action.y != null ? Math.min(0.96, Math.max(0, action.y)) : Math.min(0.6, 0.06 + (n % 6) * 0.05),
      };
      if (action.widgetType === 'text') {
        widget.text = 'New text box';
        widget.fontSize = 16;
      }
      return { ...state, widgets: [...state.widgets, widget], nextWidgetId: state.nextWidgetId + 1 };
    }
    case 'REMOVE_WIDGET':
      return { ...state, widgets: state.widgets.filter((w) => w.id !== action.id) };
    case 'MOVE_WIDGET':
      return { ...state, widgets: state.widgets.map((w) => (w.id === action.id ? { ...w, x: action.x, y: action.y } : w)) };
    case 'SET_WIDGET_TEXT':
      return { ...state, widgets: state.widgets.map((w) => (w.id === action.id ? { ...w, text: action.text } : w)) };
    case 'ADJUST_WIDGET_FONT_SIZE':
      return {
        ...state,
        widgets: state.widgets.map((w) =>
          w.id === action.id ? { ...w, fontSize: Math.min(FONT_MAX, Math.max(FONT_MIN, (w.fontSize ?? 16) + action.delta)) } : w,
        ),
      };
    default:
      return state;
  }
}
