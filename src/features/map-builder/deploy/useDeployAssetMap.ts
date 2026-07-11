import type { RefObject } from 'react';
import type L from 'leaflet';
import { ORDER } from '../../../domain/constants';
import { serializeProject } from '../../../lib/persistence';
import { Store } from '../../../lib/store';
import type { ArcgisLayerRecord, BasemapId, BuilderLayerCfg, UtilId, Widget } from '../../../domain/types';
import type { NetworkState } from '../../../state/network/networkTypes';
import { currentComposition } from './currentComposition';
import { makePayload } from './deployPayload';
import { viewerHtmlFromPayload } from './deployViewerHtml';

const DEPLOY_PREFIX = 'conduit:deploy:';

function liveUrlFor(name: string): string {
  return `${location.origin}${location.pathname}?view=${encodeURIComponent(name)}`;
}

export interface UseDeployAssetMapOptions {
  mapRef: RefObject<L.Map | null>;
  network: NetworkState;
  currentClient: string | null;
  persistCurrentClient: () => Promise<unknown>;
  arcgisLayers: ArcgisLayerRecord[];
  layers: Record<UtilId, BuilderLayerCfg>;
  basemap: BasemapId;
  widgets: Widget[];
  onToast: (message: string) => void;
}

/**
 * Mirrors the original's `deployAssetMap()`: with a client selected, persists
 * the current geometry + composition and opens a stable live URL that
 * re-reads from storage on every load; with no client, opens a frozen static
 * snapshot instead (falls back to a download if pop-ups are blocked).
 */
export function useDeployAssetMap(opts: UseDeployAssetMapOptions): () => Promise<void> {
  return async function deploy() {
    const total = ORDER.reduce((sum, id) => sum + opts.network.networks[id].features.length, 0);
    if (!total) {
      opts.onToast('Nothing to deploy — add some features in Asset Manager first.');
      return;
    }
    const comp = currentComposition(opts.mapRef, opts.arcgisLayers, opts.layers, opts.basemap, opts.widgets);

    if (opts.currentClient) {
      await opts.persistCurrentClient();
      try {
        await Store.set(
          DEPLOY_PREFIX + opts.currentClient,
          JSON.stringify({ ...comp, generated: `live · updated ${new Date().toLocaleString()}` }),
        );
      } catch {
        /* best-effort */
      }
      const url = liveUrlFor(opts.currentClient);
      const win = window.open(url, '_blank');
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        /* clipboard unavailable */
      }
      opts.onToast(win ? 'Live asset map opened (link copied). Edit → Save → refresh it to update.' : `Live link copied — open it: ${url}`);
      return;
    }

    const payload = makePayload('Untitled Project', serializeProject(opts.network).networks, comp);
    const blobUrl = URL.createObjectURL(new Blob([viewerHtmlFromPayload(payload)], { type: 'text/html' }));
    const win = window.open(blobUrl, '_blank');
    if (!win) {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'asset-map.html';
      a.click();
      opts.onToast('Pop-up blocked — downloaded a snapshot. Save as a client for a live, updatable link.');
    } else {
      opts.onToast('Deployed a static snapshot. Save this as a client to get a live link that updates on save.');
    }
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  };
}
