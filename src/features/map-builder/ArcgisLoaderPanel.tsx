import { useRef, useState } from 'react';
import type { UseArcgisLayersResult } from '../../shared/hooks/useArcgisLayers';

const CHECK_SVG = '<svg viewBox="0 0 12 12"><path d="M2 6l3 3 5-6"/></svg>';

interface ArcgisLoaderPanelProps {
  arcgis: UseArcgisLayersResult;
}

/** The "ArcGIS layers" section of the Builder sidebar — URL input + status + toggleable layer list. */
export function ArcgisLoaderPanel({ arcgis }: ArcgisLoaderPanelProps) {
  const [url, setUrl] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleAdd() {
    await arcgis.addFromUrl(url);
    setUrl('');
    inputRef.current?.focus();
  }

  return (
    <section className="bs-foot">
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
      {arcgis.status && (
        <div className={`ags-status show${arcgis.status.isErr ? ' err' : ''}`}>{arcgis.status.message}</div>
      )}
      <div className="ags-list">
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
      <p className="note">
        Add a Feature Layer, Feature/Map Service, or cached MapServer by URL — e.g. <code>…/FeatureServer/0</code>. Layers draw on the
        canvas and travel with the deployed map.
      </p>
    </section>
  );
}
