import { ORDER, UTILS } from '../../domain/constants';
import { counts } from '../../state/network/networkSelectors';
import type { UtilId } from '../../domain/types';
import type { NetworkState } from '../../state/network/networkTypes';

interface NetworkVisibilityListProps {
  network: NetworkState;
  onToggle: (util: UtilId, visible: boolean) => void;
}

export function NetworkVisibilityList({ network, onToggle }: NetworkVisibilityListProps) {
  return (
    <div id="layers">
      {ORDER.map((id) => {
        const u = UTILS[id];
        const bucket = network.networks[id];
        return (
          <div
            key={id}
            className={`layer-row${bucket.visible ? ' on' : ''}`}
            style={{ ['--u' as string]: u.color }}
            onClick={() => onToggle(id, !bucket.visible)}
          >
            <span className="check">
              <svg viewBox="0 0 12 12">
                <path d="M2 6l3 3 5-6" />
              </svg>
            </span>
            <span className="lc" />
            <span className="ln">{u.label}</span>
            <span className="cnt tnum">{counts(network, id).total}</span>
          </div>
        );
      })}
    </div>
  );
}
