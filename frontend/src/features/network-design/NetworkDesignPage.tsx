import { useRef, useState } from 'react';
import { UTILS } from '../../domain/constants';
import { formatLength, lineLengthMeters } from '../../domain/geometry';
import type { BasemapId, LatLng, UtilId } from '../../domain/types';
import { useInvalidateOnVisible } from '../../leaflet/useInvalidateOnVisible';
import { useLazyMapInit } from '../../leaflet/useLazyMapInit';
import { useLeafletMap } from '../../leaflet/useLeafletMap';
import { useNetwork } from '../../state/network/NetworkContext';
import type { NetworkState } from '../../state/network/networkTypes';
import { useUi } from '../../state/ui/UiContext';
import { NetworkDesignCanvas } from './NetworkDesignCanvas';
import { NetworkDesignSidebar } from './NetworkDesignSidebar';
import { useNetworkDesignMap } from './useNetworkDesignMap';
import { useNetworkDesignRouting } from './useNetworkDesignRouting';
import { useRouteVertexEditing } from './useRouteVertexEditing';

/** Lazily mounts on first visit to the Network Design tab, then stays mounted (CSS-hidden) — matches Crossings/Builder. */
export function NetworkDesignPage() {
  const { state: ui, dispatch: uiDispatch } = useUi();
  const { state: network, dispatch: networkDispatch } = useNetwork();
  const initiated = useLazyMapInit(ui.mainView === 'networkdesign');

  if (!initiated) return <div className="netdesign" id="netdesign" />;
  return (
    <NetworkDesignInner
      isVisible={ui.mainView === 'networkdesign'}
      network={network}
      onAddLine={(util, latlngs) => networkDispatch({ type: 'ADD_LINE', util, latlngs })}
      onToast={(message) => uiDispatch({ type: 'SHOW_TOAST', message })}
    />
  );
}

interface NetworkDesignInnerProps {
  isVisible: boolean;
  network: NetworkState;
  onAddLine: (util: UtilId, latlngs: LatLng[]) => void;
  onToast: (message: string) => void;
}

function NetworkDesignInner({ isVisible, network, onAddLine, onToast }: NetworkDesignInnerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useLeafletMap(containerRef, { zoomControl: true, center: [32.74, -97.05], zoom: 13 });
  const [basemap, setBasemap] = useState<BasemapId>('gray');
  const [target, setTarget] = useState<UtilId>('telecom');

  useInvalidateOnVisible(mapRef, isVisible);

  const routing = useNetworkDesignRouting(onToast);
  useNetworkDesignMap(mapRef, basemap, network, routing.waypoints, routing.routeLatLngs, routing.addWaypoint);
  useRouteVertexEditing(mapRef, routing.routeLatLngs, routing.routeVersion, routing.setRouteLatLngs, routing.markEdited, onToast);

  const hasRoute = !!(routing.routeLatLngs && routing.routeLatLngs.length >= 2);

  const hint = !routing.waypoints.length
    ? 'Click the map to set the start point.'
    : routing.waypoints.length < 2
      ? 'Click the map to add the end point (and any waypoints).'
      : 'Drag vertices to fine-tune, then pick a network and Add. Click the map to add another waypoint.';

  const status = routing.routing
    ? 'Routing…'
    : hasRoute
      ? `${formatLength(lineLengthMeters(routing.routeLatLngs!))}${routing.routed ? ' along the street network' : ' (edited)'}`
      : '';

  function handleAdd() {
    if (!routing.routeLatLngs || routing.routeLatLngs.length < 2) return;
    const len = formatLength(lineLengthMeters(routing.routeLatLngs));
    onAddLine(target, routing.routeLatLngs);
    routing.clear();
    onToast(`Added a ${len} line to ${UTILS[target].label}.`);
  }

  return (
    <div className="netdesign" id="netdesign">
      <NetworkDesignSidebar
        status={status}
        statusErr={false}
        canAdd={hasRoute}
        target={target}
        onTargetChange={setTarget}
        basemap={basemap}
        onBasemapChange={setBasemap}
        onUndo={routing.undo}
        onClear={routing.clear}
        onAdd={handleAdd}
      />
      <NetworkDesignCanvas containerRef={containerRef} hint={hint} />
    </div>
  );
}
