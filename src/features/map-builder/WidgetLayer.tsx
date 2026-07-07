import type L from 'leaflet';
import type { RefObject } from 'react';
import type { BuilderLayerCfg, UtilId, Widget } from '../../domain/types';
import type { NetworkState } from '../../state/network/networkTypes';
import { WidgetShell } from './WidgetShell';
import { FiberToolsWidget } from './widgets/FiberToolsWidget';
import { LayerListWidget } from './widgets/LayerListWidget';
import { LegendWidget } from './widgets/LegendWidget';
import { NorthArrowWidget } from './widgets/NorthArrowWidget';
import { PipeFlowWidget } from './widgets/PipeFlowWidget';
import { ScaleBarWidget } from './widgets/ScaleBarWidget';
import { TextWidget } from './widgets/TextWidget';

interface WidgetLayerProps {
  widgetLayerRef: RefObject<HTMLDivElement | null>;
  mapRef: RefObject<L.Map | null>;
  widgets: Widget[];
  network: NetworkState;
  layers: Record<UtilId, BuilderLayerCfg>;
  onMove: (id: string, x: number, y: number) => void;
  onRemove: (id: string) => void;
  onTextChange: (id: string, text: string) => void;
  onFontSizeAdjust: (id: string, delta: number) => void;
  onToggleLayerVisible: (util: UtilId, visible: boolean) => void;
}

export function WidgetLayer({
  widgetLayerRef,
  mapRef,
  widgets,
  network,
  layers,
  onMove,
  onRemove,
  onTextChange,
  onFontSizeAdjust,
  onToggleLayerVisible,
}: WidgetLayerProps) {
  return (
    <div className="widget-layer" id="widgetLayer" ref={widgetLayerRef}>
      {widgets.map((w) => {
        let body: React.ReactNode;
        let extraButtons: React.ReactNode;
        if (w.type === 'text') {
          body = <TextWidget widget={w} onTextChange={(text) => onTextChange(w.id, text)} />;
          extraButtons = (
            <>
              <button title="Smaller text" onClick={() => onFontSizeAdjust(w.id, -2)}>
                A−
              </button>
              <button title="Larger text" onClick={() => onFontSizeAdjust(w.id, 2)}>
                A+
              </button>
            </>
          );
        } else if (w.type === 'legend') {
          body = <LegendWidget network={network} layers={layers} />;
        } else if (w.type === 'layerlist') {
          body = <LayerListWidget network={network} layers={layers} onToggleVisible={onToggleLayerVisible} />;
        } else if (w.type === 'scalebar') {
          body = <ScaleBarWidget mapRef={mapRef} />;
        } else if (w.type === 'fibertools') {
          body = <FiberToolsWidget />;
        } else if (w.type === 'pipeflow') {
          body = <PipeFlowWidget />;
        } else {
          body = <NorthArrowWidget />;
        }
        return (
          <WidgetShell key={w.id} widget={w} widgetLayerRef={widgetLayerRef} onMove={onMove} onRemove={onRemove} extraButtons={extraButtons}>
            {body}
          </WidgetShell>
        );
      })}
    </div>
  );
}
