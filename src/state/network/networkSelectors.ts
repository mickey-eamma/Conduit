import { ORDER } from '../../domain/constants';
import type { Feature, LineFeature, UtilId } from '../../domain/types';
import type { NetworkState } from './networkTypes';

export interface FeatureCounts {
  line: number;
  source: number;
  join: number;
  delivery: number;
  total: number;
}

export function counts(state: NetworkState, util: UtilId): FeatureCounts {
  const c: FeatureCounts = { line: 0, source: 0, join: 0, delivery: 0, total: 0 };
  for (const f of state.networks[util].features) c[f.type]++;
  c.total = state.networks[util].features.length;
  return c;
}

export function totalFeatureCount(state: NetworkState): number {
  return ORDER.reduce((sum, id) => sum + state.networks[id].features.length, 0);
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
