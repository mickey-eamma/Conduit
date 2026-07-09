import { GLYPH, UTILS } from '../../domain/constants';
import type { UtilId } from '../../domain/types';

interface LandFlyoutProps {
  active: UtilId;
  landCount: number;
  parcelCount: number;
  combinedCount: number;
  onSelect: (id: UtilId) => void;
}

/** The hover-flyout "Land" rail tab: clicking the tab body defaults to Sites, hovering reveals Sites/Parcels sub-buttons. */
export function LandFlyout({ active, landCount, parcelCount, combinedCount, onSelect }: LandFlyoutProps) {
  const lu = UTILS.land;
  const isActive = active === 'land' || active === 'parcel';

  return (
    <div
      className={`util-tab land-group${isActive ? ' active' : ''}`}
      style={{ ['--u' as string]: lu.color }}
      onClick={() => onSelect('land')}
    >
      <div className="glyph" dangerouslySetInnerHTML={{ __html: GLYPH.land }} />
      <div className="nm">{lu.label}</div>
      <div className="ct">{combinedCount}</div>
      <div className="land-flyout">
        <button
          type="button"
          className={`land-sub${active === 'land' ? ' on' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect('land');
          }}
        >
          <span className="lf-glyph" dangerouslySetInnerHTML={{ __html: GLYPH.land }} />
          <span className="lf-nm">Sites</span>
          <span className="sub-ct">{landCount}</span>
        </button>
        <button
          type="button"
          className={`land-sub${active === 'parcel' ? ' on' : ''}`}
          style={{ ['--u' as string]: UTILS.parcel.color }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect('parcel');
          }}
        >
          <span className="lf-glyph" dangerouslySetInnerHTML={{ __html: GLYPH.parcel }} />
          <span className="lf-nm">Parcels</span>
          <span className="sub-ct">{parcelCount}</span>
        </button>
      </div>
    </div>
  );
}
