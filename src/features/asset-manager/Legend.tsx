import { UTILS } from '../../domain/constants';
import type { UtilId } from '../../domain/types';

interface LegendProps {
  util: UtilId;
}

const LINE_POINT_ROWS: { sym: string; role: string; term: keyof (typeof UTILS)['telecom']['terms'] }[] = [
  { sym: 'sym-line', role: 'Line', term: 'line' },
  { sym: 'sym-source', role: 'Source', term: 'source' },
  { sym: 'sym-join', role: 'Join', term: 'join' },
  { sym: 'sym-delivery', role: 'Delivery', term: 'delivery' },
];

const LAND_ROWS: { sym: string; role: string; term: keyof (typeof UTILS)['land']['terms'] }[] = [
  { sym: 'sym-site', role: 'Site', term: 'site' },
  { sym: 'sym-lease', role: 'Lease', term: 'lease' },
  { sym: 'sym-building', role: 'Building', term: 'building' },
];

const PARCEL_ROWS: { sym: string; role: string; term: keyof (typeof UTILS)['parcel']['terms'] }[] = [
  { sym: 'sym-parcel', role: 'Parcel', term: 'parcel' },
];

export function Legend({ util }: LegendProps) {
  const u = UTILS[util];
  const rows = util === 'land' ? LAND_ROWS : util === 'parcel' ? PARCEL_ROWS : LINE_POINT_ROWS;
  return (
    <div id="legend">
      {rows.map((row) => (
        <div className="legend-row" key={row.sym}>
          <span className="sym">
            <span className={row.sym} />
          </span>
          <span>
            <div className="role">{row.role}</div>
            <div className="term">{u.terms[row.term as keyof typeof u.terms]}</div>
          </span>
        </div>
      ))}
    </div>
  );
}
