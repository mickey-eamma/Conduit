import { useEffect, useRef } from 'react';
import { useUi } from '../../state/ui/UiContext';
import { useNetwork } from '../../state/network/NetworkContext';
import { totalFeatureCount, counts } from '../../state/network/networkSelectors';
import { useInvalidateOnVisible } from '../../leaflet/useInvalidateOnVisible';
import { useAssetMap } from './useAssetMap';
import { useAssetMapInteractions } from './useAssetMapInteractions';
import { useGeometryEditing } from './useGeometryEditing';
import { useHalo } from './useHalo';
import { useRisers } from './useRisers';
import { useFiberModals } from './fiber/useFiberModals';
import { SpliceMatrixModal } from './fiber/SpliceMatrixModal';
import { FiberCableTableModal } from './fiber/FiberCableTableModal';
import { SignalTraceModal } from './fiber/SignalTraceModal';
import { useFlowTrace } from './flow/useFlowTrace';
import { FlowTraceModal } from './flow/FlowTraceModal';
import { useImportPreview } from './useImportPreview';
import { ImportControls } from './ImportControls';
import { BasemapNote } from './BasemapNote';
import { UtilRail } from './UtilRail';
import { Toolbar } from './Toolbar';
import { HintPill } from './HintPill';
import { StatusBar } from './StatusBar';
import { AttributePanel } from './AttributePanel';
import { Legend } from './Legend';
import { NetworkVisibilityList } from './NetworkVisibilityList';
import { TotalsPanel } from './TotalsPanel';
import { ViewTabs } from './ViewTabs';
import { cursorForTool } from './hintText';
import { ORDER, UTILS } from '../../domain/constants';
import type { UtilId } from '../../domain/types';
import { DashboardPage } from '../dashboard/DashboardPage';

export function AssetManagerPage() {
  const { state: ui, dispatch: uiDispatch } = useUi();
  const { state: network, dispatch: networkDispatch } = useNetwork();
  const containerRef = useRef<HTMLDivElement>(null);
  const { mapRef, basemapNoteVisible, dismissBasemapNote } = useAssetMap(containerRef);
  const isActive = ui.mainView === 'assets' && ui.activeView === 'map';

  useInvalidateOnVisible(mapRef, isActive);

  const fiberModals = useFiberModals(mapRef, network);
  const flowTrace = useFlowTrace(mapRef, network);

  const { coords, layerAccess } = useAssetMapInteractions(
    mapRef,
    ui,
    uiDispatch,
    network,
    networkDispatch,
    isActive,
    fiberModals.isAnyOpen || !!flowTrace.trace,
    fiberModals.openMatrix,
  );
  useHalo(mapRef, network, ui.selectedUtil, ui.selectedFeatureId);
  useRisers(network, layerAccess);
  const geometryEditing = useGeometryEditing(
    mapRef,
    network,
    networkDispatch,
    (message) => uiDispatch({ type: 'SHOW_TOAST', message }),
    ui.selectedFeatureId,
    ui.tool,
  );
  const importPreview = useImportPreview(mapRef, ui.selectedUtil, networkDispatch, (message) =>
    uiDispatch({ type: 'SHOW_TOAST', message }),
  );

  // The accent color is a global theme var that follows the selected network.
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', UTILS[ui.selectedUtil].color);
  }, [ui.selectedUtil]);

  const railCounts = Object.fromEntries(ORDER.map((id) => [id, counts(network, id).total])) as Record<
    UtilId,
    number
  >;

  return (
    <>
      <UtilRail
        active={ui.selectedUtil}
        counts={railCounts}
        onSelect={(id) => uiDispatch({ type: 'SET_UTIL', util: id })}
      />
      <main className="map-area" data-cursor={cursorForTool(ui.tool)}>
        <Toolbar active={ui.tool} currentUtil={ui.selectedUtil} onSelect={(tool) => uiDispatch({ type: 'SET_TOOL', tool })} />
        <ViewTabs active={ui.activeView} onChange={(view) => uiDispatch({ type: 'SET_ACTIVE_VIEW', view })} />
        <div id="map" ref={containerRef} />
        <ImportControls importPreview={importPreview} />
        <BasemapNote visible={basemapNoteVisible} onDismiss={dismissBasemapNote} />
        <HintPill tool={ui.tool} util={ui.selectedUtil} />
        <StatusBar util={ui.selectedUtil} tool={ui.tool} featureCount={totalFeatureCount(network)} coords={coords} />
      </main>
      <aside className="panel">
        <section>
          <h3>Feature details</h3>
          <AttributePanel
            network={network}
            networkDispatch={networkDispatch}
            ui={ui}
            uiDispatch={uiDispatch}
            geometryEditing={geometryEditing}
            onOpenMatrix={fiberModals.openMatrix}
            onOpenFiberTable={fiberModals.openCableTable}
            onTraceFlow={flowTrace.runTrace}
          />
        </section>
        <section>
          <div className="net-title">
            <span className="swatch" />
            <span className="nm">{UTILS[ui.selectedUtil].label}</span>
          </div>
          <Legend util={ui.selectedUtil} />
        </section>
        <section>
          <h3>Networks · visibility</h3>
          <NetworkVisibilityList
            network={network}
            onToggle={(util, visible) => networkDispatch({ type: 'SET_NETWORK_VISIBLE', util, visible })}
          />
        </section>
        <section>
          <h3>Totals</h3>
          <TotalsPanel network={network} util={ui.selectedUtil} />
          <p className="note">
            Snapping is on — vertices and nodes lock onto nearby {UTILS[ui.selectedUtil].label.toLowerCase()} points so
            segments connect cleanly.
          </p>
        </section>
      </aside>
      {fiberModals.matrixFeature && (
        <SpliceMatrixModal
          feature={fiberModals.matrixFeature}
          network={network}
          networkDispatch={networkDispatch}
          onClose={fiberModals.closeMatrix}
        />
      )}
      {fiberModals.cableTableLine && (
        <FiberCableTableModal
          line={fiberModals.cableTableLine}
          telecomFeatures={network.networks.telecom.features}
          onClose={fiberModals.closeCableTable}
          onTrace={(fiber) => fiberModals.runTrace(fiberModals.cableTableLine!.code, fiber)}
        />
      )}
      {fiberModals.trace && (
        <SignalTraceModal
          network={network}
          seq={fiberModals.trace.seq}
          startCable={fiberModals.trace.cable}
          startFiber={fiberModals.trace.fiber}
          onClose={fiberModals.closeTrace}
        />
      )}
      {flowTrace.trace && <FlowTraceModal network={network} trace={flowTrace.trace} onClose={flowTrace.closeTrace} />}
      {ui.activeView === 'dashboard' && <DashboardPage network={network} />}
    </>
  );
}
