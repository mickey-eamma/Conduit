import type { AssetRecord, EventStage, LineFeature } from './types';

export const DEFAULT_STAGE_NAMES = ['Design', 'Order', 'Installation', 'Testing'];

export function eventCountForLine(feature: LineFeature): number {
  return (feature.props.stages ?? []).reduce((sum, s) => sum + s.events.length, 0);
}

export function defaultAsset(feature: LineFeature): AssetRecord {
  return { assetName: feature.props.name || '', projectNo: '', projectDate: '', manufacturer: '', description: '' };
}

export function defaultStages(): EventStage[] {
  return DEFAULT_STAGE_NAMES.map((name) => ({ name, events: [] }));
}
