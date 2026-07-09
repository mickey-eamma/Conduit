import { STATUS_DASH, STATUS_OPACITY } from './constants';
import { LAND_STYLE } from './landStyle';
import type { LineFeature, PointFeature, PolygonFeature } from './types';

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

export interface PolygonStyle {
  dashArray: string | null;
  opacity: number;
  fillOpacity: number;
}

/** Mirrors main's `applyStatusStyle`'s `feat.poly` branch: status overrides the base `LAND_STYLE`, and Abandoned dims the fill. */
export function getPolygonStyle(feature: PolygonFeature): PolygonStyle {
  const s = feature.props.status;
  const base = LAND_STYLE[feature.type];
  return {
    dashArray: STATUS_DASH[s] ?? base.dashArray,
    opacity: STATUS_OPACITY[s] ?? base.opacity,
    fillOpacity: s === 'Abandoned' ? base.fillOpacity * 0.4 : base.fillOpacity,
  };
}
