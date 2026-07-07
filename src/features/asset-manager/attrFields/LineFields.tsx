import { isFlowNet } from '../../../domain/flow';
import { formatLength, lineLengthMeters } from '../../../domain/geometry';
import { ReadOnlyField } from '../../../shared/ui/Field';
import { TelecomLineFields } from './TelecomLineFields';
import type { FeatureProps, LineFeature } from '../../../domain/types';
import type { NetworkState } from '../../../state/network/networkTypes';
import type { UseGeometryEditingResult } from '../useGeometryEditing';

interface LineFieldsProps {
  feature: LineFeature;
  network: NetworkState;
  updateProps: (props: Partial<FeatureProps>) => void;
  geometryEditing: UseGeometryEditingResult;
  onOpenFiberTable?: (line: LineFeature) => void;
  onTraceFlow?: (line: LineFeature, dir: 'up' | 'down') => void;
}

export function LineFields({
  feature,
  network,
  updateProps,
  geometryEditing,
  onOpenFiberTable,
  onTraceFlow,
}: LineFieldsProps) {
  const isEditing = geometryEditing.editingFeatureId === feature.id;

  return (
    <>
      {feature.util === 'telecom' && (
        <TelecomLineFields feature={feature} telecomFeatures={network.networks.telecom.features} updateProps={updateProps} />
      )}
      <ReadOnlyField label="Length" value={formatLength(lineLengthMeters(feature.latlngs))} />
      <button
        type="button"
        className={`btn edit-geo${isEditing ? ' active' : ''}`}
        onClick={() => geometryEditing.toggleEdit(feature)}
      >
        {isEditing ? 'Done editing geometry' : 'Edit geometry'}
      </button>
      {feature.util === 'telecom' && (
        <button type="button" className="btn matrix" onClick={() => onOpenFiberTable?.(feature)}>
          Trace fibers
        </button>
      )}
      {isFlowNet(feature.util) && (
        <>
          <button type="button" className="btn flow" onClick={() => onTraceFlow?.(feature, 'down')}>
            Trace downstream
          </button>
          <button type="button" className="btn flow up" onClick={() => onTraceFlow?.(feature, 'up')}>
            Trace upstream
          </button>
        </>
      )}
    </>
  );
}
