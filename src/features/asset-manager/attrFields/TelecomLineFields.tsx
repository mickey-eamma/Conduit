import { FIBER_COUNTS } from '../../../domain/constants';
import { branchAssignmentFor } from '../../../domain/fiber';
import { Field, ReadOnlyField } from '../../../shared/ui/Field';
import type { Feature, FeatureProps, LineFeature, PlacementType } from '../../../domain/types';

interface TelecomLineFieldsProps {
  feature: LineFeature;
  telecomFeatures: Feature[];
  updateProps: (props: Partial<FeatureProps>) => void;
}

export function TelecomLineFields({ feature, telecomFeatures, updateProps }: TelecomLineFieldsProps) {
  const assignment = branchAssignmentFor(feature, telecomFeatures);

  return (
    <>
      {assignment ? (
        <ReadOnlyField
          label="Fiber count"
          value={`${assignment.count} fiber`}
          sub={`assigned by ${assignment.splice.props.name || assignment.splice.code} · strands ${assignment.from}–${assignment.to}`}
        />
      ) : (
        <Field label="Fiber count">
          <select
            value={feature.props.fiberCount}
            onChange={(e) => updateProps({ fiberCount: parseInt(e.target.value, 10) })}
          >
            {FIBER_COUNTS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field label="Placement">
        <select
          value={feature.props.placement ?? 'Aerial'}
          onChange={(e) => updateProps({ placement: e.target.value as PlacementType })}
        >
          <option>Aerial</option>
          <option>Underground</option>
        </select>
      </Field>
    </>
  );
}
