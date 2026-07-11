import { linesExcluding } from '../../../state/network/networkSelectors';
import { fiberTallyText, fiberWarnText } from '../attributeText';
import { LineSelect } from './LineSelect';
import { BranchRow } from './BranchRow';
import { parentFiberCount, branchStats } from '../../../domain/fiber';
import type { FeatureProps, FiberBranch, PointFeature } from '../../../domain/types';
import type { NetworkState } from '../../../state/network/networkTypes';

interface TelecomSpliceFieldsProps {
  feature: PointFeature;
  network: NetworkState;
  updateProps: (props: Partial<FeatureProps>) => void;
  onOpenMatrix?: (feature: PointFeature) => void;
}

export function TelecomSpliceFields({ feature, network, updateProps, onOpenMatrix }: TelecomSpliceFieldsProps) {
  const telecomFeatures = network.networks.telecom.features;
  const allLines = linesExcluding(network, 'telecom');
  const branches = feature.props.branches ?? [];
  const maxFiber = parentFiberCount(feature, telecomFeatures);
  const warn = fiberWarnText(feature, telecomFeatures);
  const ready = !!feature.props.parentLine && branches.some((b) => b.line);

  function setBranches(next: FiberBranch[]) {
    updateProps({ branches: next });
  }

  return (
    <div className="rel-block">
      <div className="field">
        <label>Incoming cable</label>
        <LineSelect lines={allLines} value={feature.props.parentLine ?? ''} onChange={(line) => updateProps({ parentLine: line })} />
      </div>
      <div className="fiber-head">
        <span>Fiber branches</span>
        <span className="fiber-tally">{fiberTallyText(feature, telecomFeatures)}</span>
      </div>
      <div>
        {branches.map((b, i) => (
          <BranchRow
            key={i}
            branch={b}
            maxFiber={maxFiber}
            lines={allLines.filter((l) => l.code !== feature.props.parentLine)}
            onChange={(next) => setBranches(branches.map((x, idx) => (idx === i ? next : x)))}
            onDelete={() => setBranches(branches.filter((_, idx) => idx !== i))}
          />
        ))}
      </div>
      <button
        type="button"
        className="btn add"
        disabled={!feature.props.parentLine}
        onClick={() => {
          const s = branchStats(feature, telecomFeatures);
          const start = Math.min(s.X, s.allocated + 1) || 1;
          setBranches([...branches, { line: '', from: start, to: s.X || start }]);
        }}
      >
        + Add branch
      </button>
      {warn && <div className="rel-warn">{warn}</div>}
      {telecomFeatures.filter((f) => f.type === 'line').length < 2 && (
        <div className="rel-hint">Draw the incoming cable and at least one branch cable to splice.</div>
      )}
      <button type="button" className="btn matrix" disabled={!ready} onClick={() => onOpenMatrix?.(feature)}>
        Open fiber splice matrix
      </button>
    </div>
  );
}
