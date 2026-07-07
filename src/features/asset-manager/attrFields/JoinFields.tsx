import { isFlowNet } from '../../../domain/flow';
import { TelecomSpliceFields } from './TelecomSpliceFields';
import { FlowJoinFields } from './FlowJoinFields';
import { ElectricJoinFields } from './ElectricJoinFields';
import type { FeatureProps, PointFeature } from '../../../domain/types';
import type { NetworkState } from '../../../state/network/networkTypes';

interface JoinFieldsProps {
  feature: PointFeature;
  network: NetworkState;
  updateProps: (props: Partial<FeatureProps>) => void;
  onOpenMatrix?: (feature: PointFeature) => void;
}

/** A "join" means something different per network — dispatches to the right shape of relationship editor. */
export function JoinFields({ feature, network, updateProps, onOpenMatrix }: JoinFieldsProps) {
  if (feature.util === 'telecom') {
    return <TelecomSpliceFields feature={feature} network={network} updateProps={updateProps} onOpenMatrix={onOpenMatrix} />;
  }
  if (isFlowNet(feature.util)) return <FlowJoinFields feature={feature} network={network} updateProps={updateProps} />;
  return <ElectricJoinFields feature={feature} network={network} updateProps={updateProps} />;
}
