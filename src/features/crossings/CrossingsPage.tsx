import { useEffect, useReducer, useRef, useState } from 'react';
import type L from 'leaflet';
import { CX_DEFAULTS } from '../../domain/constants';
import { useInvalidateOnVisible } from '../../leaflet/useInvalidateOnVisible';
import { useLazyMapInit } from '../../leaflet/useLazyMapInit';
import { useLeafletMap } from '../../leaflet/useLeafletMap';
import { agsQueryFeatures, type Bbox } from '../../lib/arcgisRest';
import { useArcgisLayers } from '../../shared/hooks/useArcgisLayers';
import { useNetwork } from '../../state/network/NetworkContext';
import type { NetworkState } from '../../state/network/networkTypes';
import { useUi } from '../../state/ui/UiContext';
import { cxAllLines } from './cxAllLines';
import { CrossingsCanvas } from './CrossingsCanvas';
import { CrossingsSummaryPanel } from './CrossingsSummaryPanel';
import { crossingsReducer, initialCrossingsState } from './crossingsState';
import { CxArcgisPanel } from './CxArcgisPanel';
import { LineChecklist } from './LineChecklist';
import { useCrossingResults } from './useCrossingResults';
import { useCrossingsMap } from './useCrossingsMap';

const CROSSINGS_PALETTE = ['#2563eb', '#db2777', '#059669', '#d97706', '#7c3aed', '#0d9488', '#dc2626', '#4338ca'];

/** Lazily mounts on first visit to the Crossings tab, then stays mounted (CSS-hidden). */
export function CrossingsPage() {
  const { state: ui } = useUi();
  const { state: network } = useNetwork();
  const initiated = useLazyMapInit(ui.mainView === 'crossings');

  if (!initiated) return <div className="crossings" id="crossings" />;
  return <CrossingsInner isVisible={ui.mainView === 'crossings'} network={network} />;
}

function boundsToBbox(map: L.Map): Bbox {
  const b = map.getBounds();
  return [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
}

function CrossingsInner({ isVisible, network }: { isVisible: boolean; network: NetworkState }) {
  const [state, dispatch] = useReducer(crossingsReducer, initialCrossingsState);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useLeafletMap(containerRef, { zoomControl: true, center: [32.74, -97.05], zoom: 12 });
  const [reloading, setReloading] = useState(false);
  const defaultsLoadedRef = useRef(false);

  useInvalidateOnVisible(mapRef, isVisible);

  const arcgis = useArcgisLayers(mapRef, { idPrefix: 'c', palette: CROSSINGS_PALETTE });
  const allLines = cxAllLines(network);
  const crossingResults = useCrossingResults(arcgis.layers, allLines, state.selected);

  useCrossingsMap(mapRef, allLines, state.selected, (code) => dispatch({ type: 'TOGGLE_LINE', code }), arcgis.layers, crossingResults);

  useEffect(() => {
    dispatch({ type: 'PRUNE_SELECTED', validCodes: new Set(allLines.map((l) => l.code)) });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the set of line codes could have changed
  }, [allLines.map((l) => l.code).join(',')]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || defaultsLoadedRef.current) return;
    defaultsLoadedRef.current = true;
    (async () => {
      const bbox = boundsToBbox(map);
      for (const d of CX_DEFAULTS) {
        try {
          const gj = await agsQueryFeatures(d.url, bbox);
          arcgis.addFeatureLayerData(d.title, d.url, gj, { color: d.color, fit: false });
        } catch {
          /* skip if the service is unreachable */
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once, when the map first exists
  }, [mapRef]);

  async function handleReload() {
    const map = mapRef.current;
    const featureLayers = arcgis.layers.filter((r) => r.kind === 'features');
    if (!featureLayers.length) {
      arcgis.setStatus({ message: 'Add a Feature Layer first, then reload it to the current view.', isErr: true });
      return;
    }
    if (!map) return;
    setReloading(true);
    arcgis.setStatus({ message: 'Reloading layers in the current view…', isErr: false });
    const { total, capped } = await arcgis.reloadLayersInView(boundsToBbox(map));
    arcgis.setStatus({
      message: `Reloaded ${featureLayers.length} layer${featureLayers.length !== 1 ? 's' : ''} · ${total} feature${total !== 1 ? 's' : ''} in view${capped ? ' (a layer hit the server limit — zoom in further)' : ''}.`,
      isErr: false,
    });
    setReloading(false);
  }

  return (
    <div className="crossings" id="crossings">
      <aside className="cx-side">
        <LineChecklist
          allLines={allLines}
          selected={state.selected}
          onToggle={(code) => dispatch({ type: 'TOGGLE_LINE', code })}
          onSelectAll={() => dispatch({ type: 'SELECT_ALL', codes: allLines.map((l) => l.code) })}
          onSelectNone={() => dispatch({ type: 'SELECT_NONE' })}
        />
        <CxArcgisPanel
          arcgis={arcgis}
          bboxOnly={state.bboxOnly}
          onBboxOnlyChange={(value) => dispatch({ type: 'SET_BBOX_ONLY', value })}
          getBbox={() => boundsToBbox(mapRef.current!)}
          reloading={reloading}
          onReload={handleReload}
        />
      </aside>
      <CrossingsCanvas containerRef={containerRef} />
      <CrossingsSummaryPanel
        selected={state.selected}
        allLines={allLines}
        arcgisLayers={arcgis.layers}
        crossingResults={crossingResults}
        expanded={state.expanded}
        onToggleExpanded={(id) => dispatch({ type: 'TOGGLE_EXPANDED', id })}
      />
    </div>
  );
}
