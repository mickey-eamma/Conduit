import { useEffect } from 'react';
import type { PolygonFeature, ToolId, UtilId } from '../../domain/types';
import type { LandContext } from './useLandContext';

interface LandContextBarProps {
  tool: ToolId;
  util: UtilId;
  landCtx: LandContext;
  onSiteChange: (code: string) => void;
  onLeaseChange: (code: string) => void;
  sites: PolygonFeature[];
  leases: PolygonFeature[];
}

/** The "Lease in Site:" / "Building in Lease:" parent picker shown under the toolbar while drawing a Lease or Building. */
export function LandContextBar({ tool, util, landCtx, onSiteChange, onLeaseChange, sites, leases }: LandContextBarProps) {
  const visible = util === 'land' && (tool === 'lease' || tool === 'building');
  const parentType = tool === 'lease' ? 'site' : 'lease';
  const options = tool === 'lease' ? sites : leases;
  const currentValue = tool === 'lease' ? landCtx.site : landCtx.lease;
  const onChange = tool === 'lease' ? onSiteChange : onLeaseChange;
  const optionCodes = options.map((o) => o.code).join(',');

  // Auto-select the first available parent whenever the current pick becomes invalid (matches main's `updateLandCtx`).
  useEffect(() => {
    if (!visible) return;
    if (!options.some((o) => o.code === currentValue)) onChange(options[0]?.code ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- optionCodes is the stable proxy for `options`
  }, [visible, optionCodes, currentValue]);

  if (!visible) return null;

  return (
    <div className="land-ctx" id="landCtx">
      <span className="lc-label">{tool === 'lease' ? 'Lease in Site:' : 'Building in Lease:'}</span>
      <select value={currentValue} disabled={!options.length} onChange={(e) => onChange(e.target.value)}>
        {options.length ? (
          options.map((f) => (
            <option key={f.code} value={f.code}>
              {f.props.name || f.code}
            </option>
          ))
        ) : (
          <option value="">— draw a {parentType} first —</option>
        )}
      </select>
    </div>
  );
}
