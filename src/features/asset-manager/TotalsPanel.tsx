import { counts, landCounts } from '../../state/network/networkSelectors';
import type { UtilId } from '../../domain/types';
import type { NetworkState } from '../../state/network/networkTypes';

interface TotalsPanelProps {
  network: NetworkState;
  util: UtilId;
}

export function TotalsPanel({ network, util }: TotalsPanelProps) {
  if (util === 'land') {
    const lc = landCounts(network);
    return (
      <div className="totals">
        <span className="pill">
          <b>{lc.site}</b> sites
        </span>
        <span className="pill">
          <b>{lc.lease}</b> leases
        </span>
        <span className="pill">
          <b>{lc.building}</b> buildings
        </span>
      </div>
    );
  }
  if (util === 'parcel') {
    const n = network.networks.parcel.features.length;
    return (
      <div className="totals">
        <span className="pill">
          <b>{n}</b> parcel{n !== 1 ? 's' : ''}
        </span>
      </div>
    );
  }
  const c = counts(network, util);
  return (
    <div className="totals">
      <span className="pill"><b>{c.line}</b> lines</span>
      <span className="pill"><b>{c.source}</b> sources</span>
      <span className="pill"><b>{c.join}</b> joins</span>
      <span className="pill"><b>{c.delivery}</b> deliveries</span>
    </div>
  );
}
