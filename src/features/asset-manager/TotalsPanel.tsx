import { counts } from '../../state/network/networkSelectors';
import type { UtilId } from '../../domain/types';
import type { NetworkState } from '../../state/network/networkTypes';

interface TotalsPanelProps {
  network: NetworkState;
  util: UtilId;
}

export function TotalsPanel({ network, util }: TotalsPanelProps) {
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
