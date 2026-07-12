import type L from 'leaflet';
import type { RefObject } from 'react';
import type { BuilderLayerCfg, UtilId, Widget } from '../../domain/types';
import type { NetworkState } from '../../state/network/networkTypes';
import { DeployButton } from './DeployButton';
import { WidgetLayer } from './WidgetLayer';

interface BuilderCanvasProps {
  containerRef: RefObject<HTMLDivElement | null>;
  widgetLayerRef: RefObject<HTMLDivElement | null>;
  mapRef: RefObject<L.Map | null>;
  widgets: Widget[];
  network: NetworkState;
  layers: Record<UtilId, BuilderLayerCfg>;
  onMoveWidget: (id: string, x: number, y: number) => void;
  onRemoveWidget: (id: string) => void;
  onWidgetTextChange: (id: string, text: string) => void;
  onWidgetFontSizeAdjust: (id: string, delta: number) => void;
  onToggleLayerVisible: (util: UtilId, visible: boolean) => void;
  onDeploy: () => void;
}

export function BuilderCanvas({
  containerRef,
  widgetLayerRef,
  mapRef,
  widgets,
  network,
  layers,
  onMoveWidget,
  onRemoveWidget,
  onWidgetTextChange,
  onWidgetFontSizeAdjust,
  onToggleLayerVisible,
  onDeploy,
}: BuilderCanvasProps) {
  return (
    <main className="b-canvas">
      <div id="bmap" ref={containerRef} />
      <WidgetLayer
        widgetLayerRef={widgetLayerRef}
        mapRef={mapRef}
        widgets={widgets}
        network={network}
        layers={layers}
        onMove={onMoveWidget}
        onRemove={onRemoveWidget}
        onTextChange={onWidgetTextChange}
        onFontSizeAdjust={onWidgetFontSizeAdjust}
        onToggleLayerVisible={onToggleLayerVisible}
      />
      <DeployButton onDeploy={onDeploy} />
    </main>
  );
}
