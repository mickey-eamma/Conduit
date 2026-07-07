import { UTILS } from './constants';
import { effectiveFiberCount } from './fiber';
import { formatLength, lineLengthMeters } from './geometry';
import type { BuilderLayerCfg, Feature, UtilId } from './types';

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

/** Mirrors the original's `builderPopupHTML` — Map Builder's per-layer configurable popup content. */
export function builderPopupHtml(util: UtilId, feature: Feature, cfg: BuilderLayerCfg, telecomFeatures: Feature[]): string | null {
  if (!cfg.popup.enabled) return null;
  const u = UTILS[util];
  const fields = cfg.popup.fields;
  let h = '';
  if (fields.code !== false) h += `<div class="pp-code">${escapeHtml(feature.code)}</div>`;
  h += `<div class="pp-name">${escapeHtml(feature.props.name || u.terms[feature.type])}</div>`;

  const rows: [string, string | number | null | undefined][] = [];
  if (fields.type !== false) {
    rows.push(['Type', u.terms[feature.type]]);
    rows.push(['Network', u.label]);
  }
  if (fields.status !== false) rows.push(['Status', feature.props.status || 'Active']);
  if (feature.type === 'line' && fields.length !== false) rows.push(['Length', formatLength(lineLengthMeters(feature.latlngs))]);
  if (util === 'telecom' && feature.type === 'line' && fields.fiber !== false) {
    rows.push(['Fibers', effectiveFiberCount(feature, telecomFeatures) || null]);
    rows.push(['Placement', feature.props.placement || 'Aerial']);
  }
  if (feature.type === 'join' && fields.links !== false) {
    if (util === 'telecom') {
      rows.push(['Parent line', feature.props.parentLine || null]);
      const branches = (feature.props.branches || []).filter((b) => b.line);
      if (branches.length) rows.push(['Branches', branches.length]);
      const splices = feature.props.splices || [];
      if (splices.length) rows.push(['Fiber splices', splices.length]);
    } else if (util === 'water' || util === 'oilgas') {
      rows.push(['Upstream', feature.props.fromLine || null]);
      const downstream = (feature.props.toLines || (feature.props.toLine ? [feature.props.toLine] : [])).filter(Boolean);
      if (downstream.length) rows.push(['Downstream', downstream.length]);
    } else {
      rows.push(['From line', feature.props.fromLine || null]);
      rows.push(['To line', feature.props.toLine || null]);
    }
  }
  for (const [label, value] of rows) {
    if (value == null || value === '') continue;
    h += `<div class="pr"><span>${escapeHtml(label)}</span><b>${escapeHtml(String(value))}</b></div>`;
  }
  return h;
}
