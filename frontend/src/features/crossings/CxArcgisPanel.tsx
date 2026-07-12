import { useRef, useState } from 'react';
import type { UseArcgisLayersResult } from '../../shared/hooks/useArcgisLayers';
import type { Bbox } from '../../lib/arcgisRest';

const CHECK_SVG = '<svg viewBox="0 0 12 12"><path d="M2 6l3 3 5-6"/></svg>';

interface CxArcgisPanelProps {
  arcgis: UseArcgisLayersResult;
  bboxOnly: boolean;
  onBboxOnlyChange: (value: boolean) => void;
  getBbox: () => Bbox;
  reloading: boolean;
  onReload: () => void;
}

/** The Crossings sidebar's "ArcGIS layers" section — adds a bbox-only checkbox and a reload-to-view button on top of the same load/toggle/remove flow as Map Builder's panel. */
export function CxArcgisPanel({ arcgis, bboxOnly, onBboxOnlyChange, getBbox, reloading, onReload }: CxArcgisPanelProps) {
  const [url, setUrl] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleAdd() {
    await arcgis.addFromUrl(url, bboxOnly ? getBbox() : null);
    setUrl('');
    inputRef.current?.focus();
  }

  return (
    <section>
      <h3>ArcGIS layers</h3>
      <div className="ags-add">
        <input
          ref={inputRef}
          type="text"
          placeholder="Paste ArcGIS REST URL…"
          autoComplete="off"
          spellCheck={false}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <button className={`btn${arcgis.busy ? ' busy' : ''}`} onClick={handleAdd}>
          Add
        </button>
      </div>
      <label className="cx-chk">
        <input type="checkbox" checked={bboxOnly} onChange={(e) => onBboxOnlyChange(e.target.checked)} />
        Only load features in the current map view
      </label>
      {arcgis.status && <div className={`ags-status show${arcgis.status.isErr ? ' err' : ''}`}>{arcgis.status.message}</div>}
      <div className="ags-list" id="cxAgsList">
        {arcgis.layers.map((rec) => (
          <div key={rec.id} className={`ags-row${rec.visible ? ' on' : ''}`}>
            <span className="ags-check" onClick={() => arcgis.toggleLayer(rec.id)} dangerouslySetInnerHTML={{ __html: CHECK_SVG }} />
            <span className="ags-sw" style={{ background: rec.color }} />
            <span className="ags-nm" title={rec.url} onClick={() => arcgis.toggleLayer(rec.id)}>
              {rec.title}
            </span>
            <span className="ags-ct">{rec.kind === 'features' ? `${rec.geojson?.features.length ?? 0} ft` : 'tiles'}</span>
            <button className="ags-del" title="Remove layer" onClick={() => arcgis.removeLayer(rec.id)}>
              &times;
            </button>
          </div>
        ))}
      </div>
      <button className={`btn cx-reload${reloading ? ' busy' : ''}`} title="Re-query every layer to the area you're now zoomed to" onClick={onReload}>
        ↻ Reload layers to current view
      </button>
      <p className="note">
        Add Feature Layers to test your selected lines against — e.g. roads, rail, streams, parcels. Servers cap each query (often 1000
        features), so zoom to your area and load/reload in view to get the right ones.
      </p>
    </section>
  );
}
