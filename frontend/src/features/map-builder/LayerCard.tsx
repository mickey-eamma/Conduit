import { UTILS, POPUP_FIELDS } from '../../domain/constants';
import type { BuilderLayerCfg, UtilId } from '../../domain/types';

const EYE_ON =
  '<svg viewBox="0 0 24 24"><path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="2.7"/></svg>';
const EYE_OFF =
  '<svg viewBox="0 0 24 24"><path d="M2 12s3.5-6.5 10-6.5c1.9 0 3.6.55 5 1.35M22 12s-3.5 6.5-10 6.5c-1.9 0-3.6-.55-5-1.35"/><path d="M4 20 20 4"/></svg>';
const CHEV = '<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>';

interface LayerCardProps {
  util: UtilId;
  cfg: BuilderLayerCfg;
  expanded: boolean;
  count: number;
  onToggleVisible: () => void;
  onToggleExpanded: () => void;
  onColorChange: (color: string) => void;
  onWeightChange: (weight: number) => void;
  onOpacityChange: (opacity: number) => void;
  onPopupEnabledChange: (enabled: boolean) => void;
  onPopupFieldChange: (field: keyof BuilderLayerCfg['popup']['fields'], value: boolean) => void;
}

/** One collapsible Map Viewer-style layer card, matching the original's `.lyr` markup exactly. */
export function LayerCard({
  util,
  cfg,
  expanded,
  count,
  onToggleVisible,
  onToggleExpanded,
  onColorChange,
  onWeightChange,
  onOpacityChange,
  onPopupEnabledChange,
  onPopupFieldChange,
}: LayerCardProps) {
  const transparencyPct = Math.round((1 - cfg.opacity) * 100);
  return (
    <div className={`lyr${expanded ? ' open' : ''}${cfg.visible ? '' : ' off'}`}>
      <div className="lyr-head" onClick={onToggleExpanded}>
        <button
          className="eye"
          title={cfg.visible ? 'Hide layer' : 'Show layer'}
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisible();
          }}
          dangerouslySetInnerHTML={{ __html: cfg.visible ? EYE_ON : EYE_OFF }}
        />
        <span className="ldot" style={{ background: cfg.color }} />
        <span className="lnm">{UTILS[util].label}</span>
        <span className="lct">{count}</span>
        <button className="chev" title="Layer properties" dangerouslySetInnerHTML={{ __html: CHEV }} />
      </div>
      <div className="lyr-body" onClick={(e) => e.stopPropagation()}>
        <div className="lc-row">
          <label>Color</label>
          <input type="color" className="li-col" value={cfg.color} onChange={(e) => onColorChange(e.target.value)} />
        </div>
        <div className="lc-row">
          <label>Line weight</label>
          <input
            type="range"
            className="li-wgt"
            min={2}
            max={7}
            step={0.5}
            value={cfg.weight}
            onChange={(e) => onWeightChange(parseFloat(e.target.value))}
          />
          <span className="lcv">{cfg.weight}</span>
        </div>
        <div className="lc-row">
          <label>Transparency</label>
          <input
            type="range"
            className="li-opa"
            min={0}
            max={80}
            step={5}
            value={transparencyPct}
            onChange={(e) => onOpacityChange(1 - parseInt(e.target.value, 10) / 100)}
          />
          <span className="lcv">{transparencyPct}%</span>
        </div>
        <div className="lc-row">
          <label>Enable pop-ups</label>
          <input type="checkbox" className="li-pop" checked={cfg.popup.enabled} onChange={(e) => onPopupEnabledChange(e.target.checked)} />
        </div>
        <div className="pf-head">Pop-up fields</div>
        <div className={`pf-grid${cfg.popup.enabled ? '' : ' dis'}`}>
          {POPUP_FIELDS.filter((f) => f[0] !== 'fiber' || util === 'telecom').map(([key, label]) => (
            <label key={key}>
              <input
                type="checkbox"
                checked={cfg.popup.fields[key as keyof BuilderLayerCfg['popup']['fields']] !== false}
                onChange={(e) => onPopupFieldChange(key as keyof BuilderLayerCfg['popup']['fields'], e.target.checked)}
              />
              {label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
