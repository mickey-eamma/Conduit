import { MODES, ORDER } from '../../domain/constants';
import type { Feature, LineFeature, PolyType, PolygonFeature, UtilId } from '../../domain/types';
import type { NetworkState } from './networkTypes';

export interface FeatureCounts {
  line: number;
  source: number;
  join: number;
  delivery: number;
  total: number;
}

/** For the 4 line/point networks only — land/parcel have a different shape, see `landCounts`. */
export function counts(state: NetworkState, util: UtilId): FeatureCounts {
  const c: FeatureCounts = { line: 0, source: 0, join: 0, delivery: 0, total: 0 };
  for (const f of state.networks[util].features) {
    if (f.type === 'line' || f.type === 'source' || f.type === 'join' || f.type === 'delivery') c[f.type]++;
  }
  c.total = state.networks[util].features.length;
  return c;
}

export interface LandCounts {
  site: number;
  lease: number;
  building: number;
  total: number;
}

/** Site/Lease/Building rollup for the `land` bucket, matching main's `renderTotals` land branch. */
export function landCounts(state: NetworkState): LandCounts {
  const features = state.networks.land.features;
  return {
    site: features.filter((f) => f.type === 'site').length,
    lease: features.filter((f) => f.type === 'lease').length,
    building: features.filter((f) => f.type === 'building').length,
    total: features.length,
  };
}

/** Site/lease/building features under `land`, optionally filtered by type — matches main's `landFeats`. */
export function landFeatsByType(state: NetworkState, type?: PolyType): PolygonFeature[] {
  const features = state.networks.land.features as PolygonFeature[];
  return type ? features.filter((f) => f.type === type) : features;
}

/** Looks up a Site/Lease/Building by code — matches main's `landByCode`. */
export function landByCode(state: NetworkState, code: string): PolygonFeature | undefined {
  return (state.networks.land.features as PolygonFeature[]).find((f) => f.code === code);
}

export function totalFeatureCount(state: NetworkState): number {
  return MODES.reduce((sum, id) => sum + state.networks[id].features.length, 0);
}

export function lineByCode(state: NetworkState, util: UtilId, code: string): LineFeature | undefined {
  return state.networks[util].features.find((f): f is LineFeature => f.type === 'line' && f.code === code);
}

export function featureById(state: NetworkState, util: UtilId, id: string): Feature | undefined {
  return state.networks[util].features.find((f) => f.id === id);
}

export function allLines(state: NetworkState): LineFeature[] {
  return ORDER.flatMap((id) => state.networks[id].features.filter((f): f is LineFeature => f.type === 'line'));
}

export function linesExcluding(state: NetworkState, util: UtilId, excludeCode?: string): LineFeature[] {
  return state.networks[util].features.filter(
    (f): f is LineFeature => f.type === 'line' && f.code !== excludeCode,
  );
}
