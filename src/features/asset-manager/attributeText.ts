import { UTILS } from '../../domain/constants';
import { branchStats } from '../../domain/fiber';
import { downOf } from '../../domain/flow';
import type { Feature, FeatureType, PointFeature } from '../../domain/types';

const PLACEHOLDERS: Record<FeatureType, string> = {
  line: 'e.g. Span A-12',
  source: 'e.g. CO North',
  join: 'e.g. SP-204',
  delivery: 'e.g. 118 Oak St',
};

export function placeholderFor(feature: Feature): string {
  return PLACEHOLDERS[feature.type];
}

export function fiberTallyText(feature: PointFeature, telecomFeatures: Feature[]): string {
  const s = branchStats(feature, telecomFeatures);
  if (!s.X) return "Set the incoming cable’s fiber count first";
  return `${s.allocated} / ${s.X} fiber allocated · ${s.remaining} free`;
}

export function fiberWarnText(feature: PointFeature, telecomFeatures: Feature[]): string {
  const s = branchStats(feature, telecomFeatures);
  if (!feature.props.parentLine) return 'Select the incoming cable this splice feeds from.';
  if (!s.X) return '';
  if (s.outOfRange) return `Some ranges fall outside 1–${s.X}, or have from greater than to.`;
  if (s.overlaps) return 'Two branches claim the same fiber strands.';
  return '';
}

export function flowJoinWarn(feature: PointFeature, networkLineCount: number): string {
  const term = UTILS[feature.util].terms.line.toLowerCase();
  if (networkLineCount < 2) return `Draw at least two ${term}s to connect.`;
  if (!feature.props.fromLine) return 'Select the upstream pipe feeding this joint.';
  if (!downOf(feature).length) return 'Add at least one downstream pipe branching from this joint.';
  return '';
}
