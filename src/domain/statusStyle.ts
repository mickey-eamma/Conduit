import { STATUS_DASH, STATUS_OPACITY } from './constants';
import type { LineFeature, PointFeature } from './types';

export interface LineStyle {
  dashArray: string | null;
  opacity: number;
}

export function getLineStyle(feature: LineFeature): LineStyle {
  const s = feature.props.status;
  if (feature.util === 'telecom') {
    const dash = feature.props.placement === 'Underground' ? '11 7' : s === 'Construction' ? '2 6' : null;
    return { dashArray: dash, opacity: STATUS_OPACITY[s] ?? 0.95 };
  }
  return { dashArray: STATUS_DASH[s] ?? null, opacity: STATUS_OPACITY[s] ?? 0.95 };
}

export interface PointStyle {
  opacity: number;
  borderStyle: 'solid' | 'dashed';
}

export function getPointStyle(feature: PointFeature): PointStyle {
  const s = feature.props.status;
  return {
    opacity: s === 'Abandoned' ? 0.5 : 1,
    borderStyle: s === 'Planned' || s === 'Construction' ? 'dashed' : 'solid',
  };
}
