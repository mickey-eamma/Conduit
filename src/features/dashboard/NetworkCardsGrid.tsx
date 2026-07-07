import { ORDER, STATUSES, STATUS_COLOR, UTILS } from '../../domain/constants';
import type { NetStats } from '../../domain/networkStats';
import type { UtilId } from '../../domain/types';
import { nf } from './formatNumber';

interface NetworkCardsGridProps {
  stats: Record<UtilId, NetStats>;
}

export function NetworkCardsGrid({ stats }: NetworkCardsGridProps) {
  return (
    <div className="dash-grid">
      {ORDER.map((id) => {
        const u = UTILS[id];
        const s = stats[id];
        const pills = STATUSES.filter((st) => s.byStatus[st]);
        return (
          <div className="net-card" style={{ '--u': u.color } as React.CSSProperties} key={id}>
            <div className="nc-head">
              <span className="nc-dot" />
              <span className="nc-name">{u.label}</span>
              <span className="nc-ft">{s.miles.toFixed(2)} mi</span>
            </div>
            <div className="nc-ft2">{nf(s.feet)} linear ft</div>
            <div className="nc-counts">
              <span>
                <b>{s.cnt.line}</b> lines
              </span>
              <span>
                <b>{s.cnt.source}</b> sources
              </span>
              <span>
                <b>{s.cnt.join}</b> joins
              </span>
              <span>
                <b>{s.cnt.delivery}</b> deliveries
              </span>
            </div>
            <div className="nc-status">
              {pills.length ? (
                pills.map((st) => (
                  <span className="st-pill" style={{ '--sc': STATUS_COLOR[st] } as React.CSSProperties} key={st}>
                    {st} {s.byStatus[st]}
                  </span>
                ))
              ) : (
                <span className="nc-empty">No features yet</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
