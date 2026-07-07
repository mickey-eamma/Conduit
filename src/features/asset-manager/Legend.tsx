import { UTILS } from '../../domain/constants';
import type { UtilId } from '../../domain/types';

interface LegendProps {
  util: UtilId;
}

const ROWS: { sym: string; role: string; term: keyof (typeof UTILS)['telecom']['terms'] }[] = [
  { sym: 'sym-line', role: 'Line', term: 'line' },
  { sym: 'sym-source', role: 'Source', term: 'source' },
  { sym: 'sym-join', role: 'Join', term: 'join' },
  { sym: 'sym-delivery', role: 'Delivery', term: 'delivery' },
];

export function Legend({ util }: LegendProps) {
  const u = UTILS[util];
  return (
    <div id="legend">
      {ROWS.map((row) => (
        <div className="legend-row" key={row.sym}>
          <span className="sym">
            <span className={row.sym} />
          </span>
          <span>
            <div className="role">{row.role}</div>
            <div className="term">{u.terms[row.term]}</div>
          </span>
        </div>
      ))}
    </div>
  );
}
