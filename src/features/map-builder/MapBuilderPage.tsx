import { useReducer, useRef } from 'react';
import { AGS_PALETTE } from '../../domain/constants';
import { useInvalidateOnVisible } from '../../leaflet/useInvalidateOnVisible';
import { useLazyMapInit } from '../../leaflet/useLazyMapInit';
import { useLeafletMap } from '../../leaflet/useLeafletMap';
import { useArcgisLayers } from '../../shared/hooks/useArcgisLayers';
import { useNetwork } from '../../state/network/NetworkContext';
import type { NetworkState } from '../../state/network/networkTypes';
import { useUi } from '../../state/ui/UiContext';
import type { UtilId, Widget } from '../../domain/types';
import { canAddWidget } from './addWidget';
import { BuilderCanvas } from './BuilderCanvas';
import { BuilderSidebar } from './BuilderSidebar';
import { builderReducer, initialBuilderState } from './builderState';
import { useBuilderMap } from './useBuilderMap';
import { useDeployAssetMap } from './deploy/useDeployAssetMap';

interface MapBuilderPageProps {
  currentClient: string | null;
  persistCurrentClient: () => Promise<void>;
}

/** Lazily mounts on first visit to the Builder tab, then stays mounted (CSS-hidden) — matches the original's `if(!builder.map) initBuilder()` pattern. */
export function MapBuilderPage({ currentClient, persistCurrentClient }: MapBuilderPageProps) {
  const { state: ui } = useUi();
  const { state: network } = useNetwork();
  const initiated = useLazyMapInit(ui.mainView === 'builder');

  if (!initiated) return <div className="builder" id="builder" />;
  return (
    <MapBuilderInner
      isVisible={ui.mainView === 'builder'}
      network={network}
      currentClient={currentClient}
      persistCurrentClient={persistCurrentClient}
    />
  );
}

interface MapBuilderInnerProps {
  isVisible: boolean;
  network: NetworkState;
  currentClient: string | null;
  persistCurrentClient: () => Promise<void>;
}

function MapBuilderInner({ isVisible, network, currentClient, persistCurrentClient }: MapBuilderInnerProps) {
  const { dispatch: uiDispatch } = useUi();
  const [state, dispatch] = useReducer(builderReducer, initialBuilderState);
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetLayerRef = useRef<HTMLDivElement>(null);
  const mapRef = useLeafletMap(containerRef, { zoomControl: true, center: [32.74, -97.05], zoom: 12 });

  useInvalidateOnVisible(mapRef, isVisible);
  useBuilderMap(mapRef, state.basemap, state.layers, network);
  const arcgis = useArcgisLayers(mapRef, { idPrefix: 'a', palette: AGS_PALETTE });

  const deploy = useDeployAssetMap({
    mapRef,
    network,
    currentClient,
    persistCurrentClient,
    arcgisLayers: arcgis.layers,
    layers: state.layers,
    basemap: state.basemap,
    widgets: state.widgets,
    onToast: (message) => uiDispatch({ type: 'SHOW_TOAST', message }),
  });

  function handleAddWidget(type: Widget['type'], x: number | null, y: number | null) {
    if (!canAddWidget(type, state.widgets)) {
      const label = type === 'legend' ? 'Legend' : type === 'layerlist' ? 'Layer list' : type === 'scalebar' ? 'Scale bar' : type === 'northarrow' ? 'North arrow' : type === 'fibertools' ? 'Fiber tools' : 'Pipe flow';
      uiDispatch({ type: 'SHOW_TOAST', message: `${label} is already on the map.` });
      return;
    }
    dispatch({ type: 'ADD_WIDGET', widgetType: type, x, y });
  }

  function handleToggleLayerVisible(util: UtilId, visible: boolean) {
    dispatch({ type: 'SET_LAYER_VISIBLE', util, visible });
  }

  return (
    <div className="builder" id="builder">
      <BuilderSidebar
        layers={state.layers}
        expandedLayers={state.expandedLayers}
        basemap={state.basemap}
        widgets={state.widgets}
        network={network}
        arcgis={arcgis}
        widgetLayerRef={widgetLayerRef}
        dispatch={dispatch}
        onAddWidget={handleAddWidget}
      />
      <BuilderCanvas
        containerRef={containerRef}
        widgetLayerRef={widgetLayerRef}
        mapRef={mapRef}
        widgets={state.widgets}
        network={network}
        layers={state.layers}
        onMoveWidget={(id, x, y) => dispatch({ type: 'MOVE_WIDGET', id, x, y })}
        onRemoveWidget={(id) => dispatch({ type: 'REMOVE_WIDGET', id })}
        onWidgetTextChange={(id, text) => dispatch({ type: 'SET_WIDGET_TEXT', id, text })}
        onWidgetFontSizeAdjust={(id, delta) => dispatch({ type: 'ADJUST_WIDGET_FONT_SIZE', id, delta })}
        onToggleLayerVisible={handleToggleLayerVisible}
        onDeploy={deploy}
      />
    </div>
  );
}
