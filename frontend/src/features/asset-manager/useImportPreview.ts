import { useRef, useState, type Dispatch, type RefObject } from 'react';
import L from 'leaflet';
import { UTILS } from '../../domain/constants';
import { parseDwgFile } from '../../lib/dwgImport';
import { parseKmlKmzFile, type ImportedLine } from '../../lib/kmlKmzImport';
import type { LatLng, UtilId } from '../../domain/types';
import type { NetworkAction } from '../../state/network/networkTypes';

export interface StagedImportLine {
  id: string;
  name: string;
  latlngs: LatLng[];
}

export interface UseImportPreviewResult {
  items: StagedImportLine[];
  targetUtil: UtilId;
  setTargetUtil: (util: UtilId) => void;
  onFileSelected: (file: File) => Promise<void>;
  importOne: (id: string) => void;
  importAll: () => void;
  clear: () => void;
}

/**
 * Stages KMZ/KML/DWG-traced lines as dashed orange preview polylines on the
 * map; clicking one (or "Add all") commits it into the currently-selected
 * target network via ADD_LINE. Mirrors the original's importGroup/importItems.
 */
export function useImportPreview(
  mapRef: RefObject<L.Map | null>,
  currentUtil: UtilId,
  networkDispatch: Dispatch<NetworkAction>,
  onToast: (message: string) => void,
): UseImportPreviewResult {
  const [items, setItems] = useState<StagedImportLine[]>([]);
  const [targetUtil, setTargetUtil] = useState<UtilId>(currentUtil);
  const groupRef = useRef<L.LayerGroup | null>(null);
  const registryRef = useRef(new Map<string, L.Polyline>());
  const nextIdRef = useRef(0);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const targetUtilRef = useRef(targetUtil);
  targetUtilRef.current = targetUtil;

  function clear() {
    const map = mapRef.current;
    if (groupRef.current && map) map.removeLayer(groupRef.current);
    groupRef.current = null;
    registryRef.current.clear();
    setItems([]);
  }

  function commitLine(item: StagedImportLine, util: UtilId) {
    networkDispatch({ type: 'ADD_LINE', util, latlngs: item.latlngs, name: item.name || undefined });
  }

  function importOne(id: string) {
    const item = itemsRef.current.find((i) => i.id === id);
    if (!item) return;
    const util = targetUtilRef.current;
    commitLine(item, util);
    const layer = registryRef.current.get(id);
    if (layer) groupRef.current?.removeLayer(layer);
    registryRef.current.delete(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    onToast(`Added “${item.name || 'line'}” to ${UTILS[util].label}.`);
  }
  const importOneRef = useRef(importOne);
  importOneRef.current = importOne;

  function importAll() {
    const util = targetUtilRef.current;
    const current = itemsRef.current;
    const n = current.length;
    if (!n) return;
    current.forEach((item) => commitLine(item, util));
    clear();
    onToast(`Added ${n} line${n !== 1 ? 's' : ''} to ${UTILS[util].label}.`);
  }

  function renderPreview(lines: ImportedLine[]) {
    clear();
    setTargetUtil(currentUtil); // default target = current network
    const map = mapRef.current;
    if (!map) return;

    const group = L.layerGroup().addTo(map);
    groupRef.current = group;
    const all: L.LatLng[] = [];
    const staged: StagedImportLine[] = [];

    for (const item of lines) {
      const id = `import-${nextIdRef.current++}`;
      const latlngs = item.latlngs.map((ll) => L.latLng(ll.lat, ll.lng));
      const pl = L.polyline(latlngs, { color: '#ea580c', weight: 3.5, opacity: 0.95, dashArray: '5 5' }).addTo(group);
      pl.bindTooltip((item.name || 'Imported line') + ' — click to add', { className: 'feat-tip', direction: 'top', opacity: 1 });
      pl.on('click', (ev) => {
        L.DomEvent.stop(ev);
        importOneRef.current(id);
      });
      registryRef.current.set(id, pl);
      staged.push({ id, name: item.name, latlngs: item.latlngs });
      latlngs.forEach((ll) => all.push(ll));
    }

    setItems(staged);
    if (all.length) map.fitBounds(L.latLngBounds(all).pad(0.2));
    onToast(`Loaded ${lines.length} line${lines.length !== 1 ? 's' : ''} — click a highlighted line to add it to ${UTILS[currentUtil].label}.`);
  }

  async function onFileSelected(file: File) {
    if (!file) return;
    const name = (file.name || '').toLowerCase();
    try {
      let lines: ImportedLine[];
      if (name.endsWith('.dwg')) {
        onToast('Reading DWG…');
        lines = await parseDwgFile(file);
      } else {
        lines = await parseKmlKmzFile(file);
      }
      if (!lines.length) onToast('No lines found in that file.');
      else renderPreview(lines);
    } catch (err) {
      onToast('Import failed: ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  return { items, targetUtil, setTargetUtil, onFileSelected, importOne, importAll, clear };
}
