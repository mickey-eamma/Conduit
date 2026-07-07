import type { ArcgisLayerRecord } from '../../domain/types';
import type { CxLayerCrossing } from './useCrossingResults';

interface CxLayerCardProps {
  rec: ArcgisLayerRecord;
  result: CxLayerCrossing;
  nameByCode: Record<string, string>;
  expanded: boolean;
  onToggleExpanded: () => void;
}

export function CxLayerCard({ rec, result, nameByCode, expanded, onToggleExpanded }: CxLayerCardProps) {
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
        </div>
      )}
    </div>
  );
}
