import { UTILS } from '../../../domain/constants';
import { downOf } from '../../../domain/flow';
import { linesExcluding } from '../../../state/network/networkSelectors';
import { flowJoinWarn } from '../attributeText';
import { LineSelect } from './LineSelect';
import type { FeatureProps, PointFeature } from '../../../domain/types';
import type { NetworkState } from '../../../state/network/networkTypes';

interface FlowJoinFieldsProps {
  feature: PointFeature;
  network: NetworkState;
  updateProps: (props: Partial<FeatureProps>) => void;
}

export function FlowJoinFields({ feature, network, updateProps }: FlowJoinFieldsProps) {
  const term = UTILS[feature.util].terms.line.toLowerCase();
  const lines = linesExcluding(network, feature.util);
  const toLines = feature.props.toLines ?? [];
  const nDown = downOf(feature).length;
  const lineCount = network.networks[feature.util].features.filter((f) => f.type === 'line').length;
  const warn = flowJoinWarn(feature, lineCount);

  function setToLines(next: string[]) {
    updateProps({ toLines: next });
  }

  return (
    <div className="rel-block">
      <div className="field">
        <label>Upstream {term}</label>
        <LineSelect lines={lines} value={feature.props.fromLine ?? ''} onChange={(fromLine) => updateProps({ fromLine })} />
      </div>
      <div className="fiber-head">
        <span>Downstream {term}s</span>
        <span className="fiber-tally">
          {nDown} branch{nDown !== 1 ? 'es' : ''}
        </span>
      </div>
      <div>
        {toLines.map((code, i) => (
          <div className="branch-row" key={i}>
            <LineSelect
              className="br-line dn-line"
              lines={lines.filter((l) => l.code !== feature.props.fromLine)}
              value={code}
              onChange={(next) => setToLines(toLines.map((c, idx) => (idx === i ? next : c)))}
            />
            <button
              type="button"
              className="br-del"
              title="Remove downstream pipe"
              onClick={() => setToLines(toLines.filter((_, idx) => idx !== i))}
            >
              &times;
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="btn add" disabled={!feature.props.fromLine} onClick={() => setToLines([...toLines, ''])}>
        + Add downstream {term}
      </button>
      {warn && <div className="rel-warn">{warn}</div>}
    </div>
  );
}
