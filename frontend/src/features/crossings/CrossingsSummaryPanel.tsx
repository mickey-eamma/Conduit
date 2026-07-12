import type { ArcgisLayerRecord } from '../../domain/types';
import { CxLayerCard } from './CxLayerCard';
import type { CxLine } from './cxAllLines';
import type { CxLayerCrossing } from './useCrossingResults';

interface CrossingsSummaryPanelProps {
  selected: Set<string>;
  allLines: CxLine[];
  arcgisLayers: ArcgisLayerRecord[];
  crossingResults: Record<string, CxLayerCrossing>;
  expanded: Record<string, boolean>;
  onToggleExpanded: (id: string) => void;
  onAddParcels: (rec: ArcgisLayerRecord) => void;
}

export function CrossingsSummaryPanel({
  selected,
  allLines,
  arcgisLayers,
  crossingResults,
  expanded,
  onToggleExpanded,
  onAddParcels,
}: CrossingsSummaryPanelProps) {
  const selN = selected.size;

  let body: React.ReactNode;
  if (!selN) {
    body = <p className="cx-empty">Select one or more of your lines to analyze.</p>;
  } else if (!arcgisLayers.length) {
    body = <p className="cx-empty">Add an ArcGIS layer to test crossings against.</p>;
  } else {
    const nameByCode: Record<string, string> = {};
    for (const l of allLines) nameByCode[l.code] = l.name;
    const grand = arcgisLayers.reduce((sum, rec) => sum + (crossingResults[rec.id]?.total ?? 0), 0);
    body = (
      <>
        <div className="cx-total">
          <div className="v">{grand}</div>
          <div className="l">
            total crossings · {selN} line{selN !== 1 ? 's' : ''} selected
          </div>
        </div>
        {arcgisLayers.map((rec) => (
          <CxLayerCard
            key={rec.id}
            rec={rec}
            result={
              crossingResults[rec.id] ?? {
                id: rec.id,
                na: rec.kind !== 'features',
                total: 0,
                perLine: {},
                points: [],
                isPolygon: false,
                hitIndices: [],
              }
            }
            nameByCode={nameByCode}
            expanded={!!expanded[rec.id]}
            onToggleExpanded={() => onToggleExpanded(rec.id)}
            onAddParcels={() => onAddParcels(rec)}
          />
        ))}
      </>
    );
  }

  return (
    <aside className="cx-panel">
      <h3>Crossing summary</h3>
      <div className="cx-sub">How many times your selected lines cross each ArcGIS layer.</div>
      <div id="cxSummary">{body}</div>
    </aside>
  );
}
