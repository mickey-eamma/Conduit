import { UTILS } from '../../../domain/constants';
import { linesExcluding } from '../../../state/network/networkSelectors';
import { LineSelect } from './LineSelect';
import type { FeatureProps, PointFeature } from '../../../domain/types';
import type { NetworkState } from '../../../state/network/networkTypes';

interface ElectricJoinFieldsProps {
  feature: PointFeature;
  network: NetworkState;
  updateProps: (props: Partial<FeatureProps>) => void;
}

export function ElectricJoinFields({ feature, network, updateProps }: ElectricJoinFieldsProps) {
  const lines = linesExcluding(network, feature.util);
  const lineCount = network.networks[feature.util].features.filter((f) => f.type === 'line').length;

  let warn = '';
  if (lineCount < 2) warn = `Draw at least two ${UTILS[feature.util].terms.line.toLowerCase()}s to connect.`;
  else if (!feature.props.fromLine || !feature.props.toLine) warn = 'Select the two lines this joint connects.';
  else if (feature.props.fromLine === feature.props.toLine) warn = 'From and to should be different lines.';

  return (
    <div className="rel-block">
      <div className="field">
        <label>From line</label>
        <LineSelect lines={lines} value={feature.props.fromLine ?? ''} onChange={(fromLine) => updateProps({ fromLine })} />
      </div>
      <div className="field">
        <label>To line</label>
        <LineSelect lines={lines} value={feature.props.toLine ?? ''} onChange={(toLine) => updateProps({ toLine })} />
      </div>
      {warn && <div className="rel-warn">{warn}</div>}
    </div>
  );
}
