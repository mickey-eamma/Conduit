import { ORDER } from '../../domain/constants';
import { createFeature } from '../../domain/featureFactory';
import { pruneReferencesToLine } from '../../domain/joinCleanup';
import type { LineFeature, PointFeature } from '../../domain/types';
import { initialNetworkState, type NetworkAction, type NetworkState } from './networkTypes';

export function networkReducer(state: NetworkState, action: NetworkAction): NetworkState {
  switch (action.type) {
    case 'ADD_LINE': {
      const { feature, nextUid } = createFeature('line', action.util, state.uid);
      const line: LineFeature = { ...feature, type: 'line', latlngs: action.latlngs } as LineFeature;
      if (action.name) line.props.name = action.name;
      return {
        uid: nextUid,
        networks: {
          ...state.networks,
          [action.util]: {
            ...state.networks[action.util],
            features: [...state.networks[action.util].features, line],
          },
        },
      };
    }
    case 'ADD_POINT': {
      const { feature, nextUid } = createFeature(action.featureType, action.util, state.uid);
      const point: PointFeature = { ...feature, type: action.featureType, latlng: action.latlng } as PointFeature;
      return {
        uid: nextUid,
        networks: {
          ...state.networks,
          [action.util]: {
            ...state.networks[action.util],
            features: [...state.networks[action.util].features, point],
          },
        },
      };
    }
    case 'UPDATE_FEATURE_PROPS': {
      const bucket = state.networks[action.util];
      return {
        ...state,
        networks: {
          ...state.networks,
          [action.util]: {
            ...bucket,
            features: bucket.features.map((f) =>
              f.id === action.id ? { ...f, props: { ...f.props, ...action.props } } : f,
            ),
          },
        },
      };
    }
    case 'UPDATE_FEATURE_GEOMETRY_LINE': {
      const bucket = state.networks[action.util];
      return {
        ...state,
        networks: {
          ...state.networks,
          [action.util]: {
            ...bucket,
            features: bucket.features.map((f) =>
              f.id === action.id && f.type === 'line' ? { ...f, latlngs: action.latlngs } : f,
            ),
          },
        },
      };
    }
    case 'UPDATE_FEATURE_GEOMETRY_POINT': {
      const bucket = state.networks[action.util];
      return {
        ...state,
        networks: {
          ...state.networks,
          [action.util]: {
            ...bucket,
            features: bucket.features.map((f) =>
              f.id === action.id && f.type !== 'line' ? { ...f, latlng: action.latlng } : f,
            ),
          },
        },
      };
    }
    case 'DELETE_FEATURE': {
      const bucket = state.networks[action.util];
      const deleted = bucket.features.find((f) => f.id === action.id);
      let features = bucket.features.filter((f) => f.id !== action.id);
      if (deleted?.type === 'line') features = pruneReferencesToLine(features, deleted.code);
      return {
        ...state,
        networks: { ...state.networks, [action.util]: { ...bucket, features } },
      };
    }
    case 'SET_NETWORK_VISIBLE': {
      const bucket = state.networks[action.util];
      return { ...state, networks: { ...state.networks, [action.util]: { ...bucket, visible: action.visible } } };
    }
    case 'LOAD_PROJECT': {
      const networks = {} as NetworkState['networks'];
      for (const id of ORDER) {
        networks[id] = { visible: true, features: action.networks[id]?.features ?? [] };
      }
      return { uid: action.uid, networks };
    }
    case 'RESET_PROJECT':
      return initialNetworkState;
    default:
      return state;
  }
}
