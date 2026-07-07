import { effectiveFiberCount } from './fiber';
import { lineLengthMeters } from './geometry';
import type { StatusName, UtilId } from './types';
import type { NetworkState } from '../state/network/networkTypes';

const METERS_TO_FEET = 3.28084;

export interface NetStats {
  meters: number;
  feet: number;
  miles: number;
  total: number;
  cnt: { line: number; source: number; join: number; delivery: number };
  byStatus: Record<StatusName, number>;
}

/** Mirrors the original's `netStats` — per-network length/count/status rollup for the Dashboard. */
export function netStats(network: NetworkState, util: UtilId): NetStats {
  const features = network.networks[util].features;
  const lines = features.filter((f) => f.type === 'line');
  let meters = 0;
  for (const l of lines) meters += lineLengthMeters(l.latlngs);

  const cnt = { line: lines.length, source: 0, join: 0, delivery: 0 };
  for (const f of features) if (f.type !== 'line') cnt[f.type]++;

  const byStatus: Record<StatusName, number> = { Active: 0, Construction: 0, Planned: 0, Abandoned: 0 };
  for (const f of features) byStatus[f.props.status]++;

  return { meters, feet: meters * METERS_TO_FEET, miles: (meters * METERS_TO_FEET) / 5280, total: features.length, cnt, byStatus };
}

export interface TelecomFiberStats {
  cables: number;
  strandFt: number;
  strandMi: number;
  splices: number;
  spliced: number;
  risers: number;
}

/** Mirrors the original's `telecomFiberStats` for the Dashboard's fiber KPI card. */
export function telecomFiberStats(network: NetworkState, riserCount: number): TelecomFiberStats {
  const features = network.networks.telecom.features;
  const lines = features.filter((f) => f.type === 'line');
  let strandFt = 0;
  for (const l of lines) strandFt += (effectiveFiberCount(l, features) || 0) * lineLengthMeters(l.latlngs) * METERS_TO_FEET;

  const joins = features.filter((f) => f.type === 'join');
  let spliced = 0;
  for (const j of joins) spliced += (j.props.splices ?? []).length;

  return { cables: lines.length, strandFt, strandMi: strandFt / 5280, splices: joins.length, spliced, risers: riserCount };
}
