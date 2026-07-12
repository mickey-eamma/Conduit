import { ORDER, UTILS } from '../../../domain/constants';
import { counts } from '../../../state/network/networkSelectors';
import type { NetworkState } from '../../../state/network/networkTypes';
import type { BuilderLayerCfg, UtilId } from '../../../domain/types';

interface LayerListWidgetProps {
  network: NetworkState;
  layers: Record<UtilId, BuilderLayerCfg>;
  onToggleVisible: (util: UtilId, visible: boolean) => void;
}

export function LayerListWidget({ network, layers, onToggleVisible }: LayerListWidgetProps) {
  const rows = ORDER.filter((id) => counts(network, id).total);
  return (
    <div className="w-layers">
      <div className="w-leg-title">Layers</div>
      {rows.length ? (
        rows.map((id) => (
          <label className="w-lyrrow" key={id}>
            <input type="checkbox" checked={layers[id].visible} onChange={(e) => onToggleVisible(id, e.target.checked)} />
            <span className="dot" style={{ background: layers[id].color }} />
            {UTILS[id].label}
            <b>{counts(network, id).total}</b>
          </label>
        ))
      ) : (
        <div className="w-leg-empty">No assets yet</div>
      )}
    </div>
  );
}
