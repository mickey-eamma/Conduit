import type { ArcgisLayerRecord } from '../../domain/types';
import type { CxLayerCrossing } from './useCrossingResults';

interface CxLayerCardProps {
  rec: ArcgisLayerRecord;
  result: CxLayerCrossing;
  nameByCode: Record<string, string>;
  expanded: boolean;
  onToggleExpanded: () => void;
  onAddParcels: () => void;
}

export function CxLayerCard({ rec, result, nameByCode, expanded, onToggleExpanded, onAddParcels }: CxLayerCardProps) {
  const codesHit = Object.keys(result.perLine);

  return (
    <div className={`cx-lyr${expanded ? ' open' : ''}`}>
      <div className="cx-lyr-head" onClick={onToggleExpanded}>
        <span className="sw" style={{ background: rec.color }} />
        <span className="nm">{rec.title}</span>
        {result.na ? <span className="na">raster · n/a</span> : <span className={`ct${result.total ? '' : ' zero'}`}>{result.total}</span>}
      </div>
      {!result.na && (
        <div className="cx-lyr-body">
          {result.isPolygon && (
            <div className="cx-note">Polygons crossed — each counted once{codesHit.length ? ' per line' : ''}.</div>
          )}
          {codesHit.length ? (
            codesHit.map((code) => (
              <div className="cx-br" key={code}>
                <span className="bn">{nameByCode[code] || code}</span>
                <span className="bv">{result.perLine[code]}</span>
              </div>
            ))
          ) : (
            <div className="cx-br">
              <span className="bn">No crossings with selected lines</span>
              <span className="bv">0</span>
            </div>
          )}
          {result.isPolygon && result.total > 0 && (
            <button
              type="button"
              className="btn cx-addparcels"
              onClick={(e) => {
                e.stopPropagation();
                onAddParcels();
              }}
            >
              Add {result.total} parcel{result.total !== 1 ? 's' : ''} to Asset Manager
            </button>
          )}
        </div>
      )}
    </div>
  );
}
