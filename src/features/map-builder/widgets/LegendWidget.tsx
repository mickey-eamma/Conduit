import { ORDER, UTILS } from '../../../domain/constants';
import { counts } from '../../../state/network/networkSelectors';
import type { NetworkState } from '../../../state/network/networkTypes';
import type { BuilderLayerCfg, UtilId } from '../../../domain/types';

interface LegendWidgetProps {
  network: NetworkState;
  layers: Record<UtilId, BuilderLayerCfg>;
}

export function LegendWidget({ network, layers }: LegendWidgetProps) {
  const rows = ORDER.filter((id) => counts(network, id).total && layers[id].visible);
  return (
    <div className="w-legend">
      <div className="w-leg-title">Legend</div>
      {rows.length ? (
        rows.map((id) => (
          <div className="w-leg-row" key={id}>
            <span className="sw" style={{ background: layers[id].color }} />
            {UTILS[id].label}
            <b>{counts(network, id).total}</b>
          </div>
        ))
      ) : (
        <div className="w-leg-empty">No visible layers</div>
      )}
    </div>
  );
}
