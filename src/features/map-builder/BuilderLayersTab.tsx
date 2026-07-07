import { ORDER } from '../../domain/constants';
import type { BasemapId, BuilderLayerCfg, UtilId } from '../../domain/types';
import type { UseArcgisLayersResult } from '../../shared/hooks/useArcgisLayers';
import type { NetworkState } from '../../state/network/networkTypes';
import { counts } from '../../state/network/networkSelectors';
import { ArcgisLoaderPanel } from './ArcgisLoaderPanel';
import { BasemapSelect } from './BasemapSelect';
import { LayerCard } from './LayerCard';
import type { BuilderAction } from './builderState';

interface BuilderLayersTabProps {
  layers: Record<UtilId, BuilderLayerCfg>;
  expandedLayers: Record<UtilId, boolean>;
  basemap: BasemapId;
  network: NetworkState;
  arcgis: UseArcgisLayersResult;
  dispatch: (action: BuilderAction) => void;
}

export function BuilderLayersTab({ layers, expandedLayers, basemap, network, arcgis, dispatch }: BuilderLayersTabProps) {
  return (
    <div className="bs-page" id="bsLayers">
      <div id="layerList">
        {ORDER.map((util) => (
          <LayerCard
            key={util}
            util={util}
            cfg={layers[util]}
            expanded={expandedLayers[util]}
            count={counts(network, util).total}
            onToggleVisible={() => dispatch({ type: 'SET_LAYER_VISIBLE', util, visible: !layers[util].visible })}
            onToggleExpanded={() => dispatch({ type: 'TOGGLE_LAYER_EXPANDED', util })}
            onColorChange={(color) => dispatch({ type: 'SET_LAYER_COLOR', util, color })}
            onWeightChange={(weight) => dispatch({ type: 'SET_LAYER_WEIGHT', util, weight })}
            onOpacityChange={(opacity) => dispatch({ type: 'SET_LAYER_OPACITY', util, opacity })}
            onPopupEnabledChange={(enabled) => dispatch({ type: 'SET_POPUP_ENABLED', util, enabled })}
            onPopupFieldChange={(field, value) => dispatch({ type: 'SET_POPUP_FIELD', util, field, value })}
          />
        ))}
      </div>
      <ArcgisLoaderPanel arcgis={arcgis} />
      <section className="bs-foot">
        <h3>Basemap</h3>
        <BasemapSelect value={basemap} onChange={(next) => dispatch({ type: 'SET_BASEMAP', basemap: next })} />
      </section>
    </div>
  );
}
