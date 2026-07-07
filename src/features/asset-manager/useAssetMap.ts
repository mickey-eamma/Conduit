import { useEffect, useState, type RefObject } from 'react';
import L from 'leaflet';
import { useLeafletMap } from '../../leaflet/useLeafletMap';
import { createAssetManagerBasemapLayers } from '../../leaflet/esriTileLayers';
import { drawGraticule } from '../../leaflet/graticule';

const DEFAULT_CENTER: L.LatLngExpression = [32.74, -97.05];
const DEFAULT_ZOOM = 12;

export interface UseAssetMapResult {
  mapRef: RefObject<L.Map | null>;
  basemapNoteVisible: boolean;
  dismissBasemapNote: () => void;
}

/**
 * Bare Asset Manager map: fixed Esri gray-canvas basemap + reference labels,
 * with the offline/sandboxed-preview graticule fallback (see original
 * initMap/drawGraticule/showBasemapNote/hideBasemapNote). Draw/select tool
 * wiring is added on top of this in Phase 6.
 */
export function useAssetMap(containerRef: RefObject<HTMLDivElement | null>): UseAssetMapResult {
  const mapRef = useLeafletMap(containerRef, { doubleClickZoom: false, zoomControl: true });
  const [basemapNoteVisible, setBasemapNoteVisible] = useState(false);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);

    const tileLayers = createAssetManagerBasemapLayers();
    tileLayers.forEach((layer) => layer.addTo(map));
    const [baseTiles] = tileLayers;

    const grat = L.layerGroup().addTo(map);
    let tilesOk = false;

    const redrawGrid = () => {
      if (!tilesOk) drawGraticule(map, grat);
    };
    redrawGrid();
    map.on('moveend zoomend', redrawGrid);

    const onTileLoad = () => {
      if (tilesOk) return;
      tilesOk = true;
      map.off('moveend zoomend', redrawGrid);
      grat.clearLayers();
      setBasemapNoteVisible(false);
    };
    const onTileError = () => {
      if (!tilesOk) setBasemapNoteVisible(true);
    };
    baseTiles.on('tileload', onTileLoad);
    baseTiles.on('tileerror', onTileError);

    return () => {
      map.off('moveend zoomend', redrawGrid);
      baseTiles.off('tileload', onTileLoad);
      baseTiles.off('tileerror', onTileError);
      tileLayers.forEach((layer) => map.removeLayer(layer));
      grat.remove();
    };
  }, [mapRef]);

  return { mapRef, basemapNoteVisible, dismissBasemapNote: () => setBasemapNoteVisible(false) };
}
