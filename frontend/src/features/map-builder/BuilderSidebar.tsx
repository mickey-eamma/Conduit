import { useState, type RefObject } from 'react';
import type { BasemapId, BuilderLayerCfg, UtilId, Widget } from '../../domain/types';
import type { UseArcgisLayersResult } from '../../shared/hooks/useArcgisLayers';
import type { NetworkState } from '../../state/network/networkTypes';
import { BuilderLayersTab } from './BuilderLayersTab';
import { BuilderWidgetsTab } from './BuilderWidgetsTab';
import type { BuilderAction } from './builderState';

type SidebarTab = 'layers' | 'widgets';

interface BuilderSidebarProps {
  layers: Record<UtilId, BuilderLayerCfg>;
  expandedLayers: Record<UtilId, boolean>;
  basemap: BasemapId;
  widgets: Widget[];
  network: NetworkState;
  arcgis: UseArcgisLayersResult;
  widgetLayerRef: RefObject<HTMLDivElement | null>;
  dispatch: (action: BuilderAction) => void;
  onAddWidget: (type: Widget['type'], x: number | null, y: number | null) => void;
}

export function BuilderSidebar({
  layers,
  expandedLayers,
  basemap,
  widgets,
  network,
  arcgis,
  widgetLayerRef,
  dispatch,
  onAddWidget,
}: BuilderSidebarProps) {
  const [tab, setTab] = useState<SidebarTab>('layers');

  return (
    <aside className="b-side">
      <div className="bs-tabs">
        <button className={`bst${tab === 'layers' ? ' active' : ''}`} onClick={() => setTab('layers')}>
          Layers
        </button>
        <button className={`bst${tab === 'widgets' ? ' active' : ''}`} onClick={() => setTab('widgets')}>
          Widgets
        </button>
      </div>
      {tab === 'layers' ? (
        <BuilderLayersTab
          layers={layers}
          expandedLayers={expandedLayers}
          basemap={basemap}
          network={network}
          arcgis={arcgis}
          dispatch={dispatch}
        />
      ) : (
        <BuilderWidgetsTab widgets={widgets} widgetLayerRef={widgetLayerRef} onAdd={onAddWidget} />
      )}
    </aside>
  );
}
