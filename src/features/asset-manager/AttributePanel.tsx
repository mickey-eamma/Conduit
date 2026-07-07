import type { Dispatch } from 'react';
import { STATUSES, UTILS } from '../../domain/constants';
import { featureById } from '../../state/network/networkSelectors';
import { placeholderFor } from './attributeText';
import { LineFields } from './attrFields/LineFields';
import { JoinFields } from './attrFields/JoinFields';
import { Field, ReadOnlyField } from '../../shared/ui/Field';
import type { FeatureProps, LineFeature, PointFeature, StatusName } from '../../domain/types';
import type { NetworkAction, NetworkState } from '../../state/network/networkTypes';
import type { UiAction, UiState } from '../../state/ui/uiTypes';
import type { UseGeometryEditingResult } from './useGeometryEditing';

interface AttributePanelProps {
  network: NetworkState;
  networkDispatch: Dispatch<NetworkAction>;
  ui: UiState;
  uiDispatch: Dispatch<UiAction>;
  geometryEditing: UseGeometryEditingResult;
  onOpenMatrix?: (feature: PointFeature) => void;
  onOpenFiberTable?: (line: LineFeature) => void;
  onTraceFlow?: (line: LineFeature, dir: 'up' | 'down') => void;
}

export function AttributePanel({
  network,
  networkDispatch,
  ui,
  uiDispatch,
  geometryEditing,
  onOpenMatrix,
  onOpenFiberTable,
  onTraceFlow,
}: AttributePanelProps) {
  const feature = ui.selectedFeatureId ? featureById(network, ui.selectedUtil, ui.selectedFeatureId) : undefined;

  if (!feature) {
    return (
      <p className="attr-empty">
        Choose the <b>Select</b> tool and click any feature on the map to name it and edit its details.
      </p>
    );
  }

  const u = UTILS[feature.util];
  const role = u.terms[feature.type];

  function updateProps(props: Partial<FeatureProps>) {
    networkDispatch({ type: 'UPDATE_FEATURE_PROPS', util: feature!.util, id: feature!.id, props });
  }

  return (
    <>
      <div className="attr-head">
        <span className="chip" style={{ background: u.color }} />
        <span className="role">{role}</span>
        <span className="code">{feature.code}</span>
      </div>
      <Field label="Name">
        <input
          type="text"
          placeholder={placeholderFor(feature)}
          value={feature.props.name ?? ''}
          onChange={(e) => updateProps({ name: e.target.value })}
        />
      </Field>
      <Field label="Status">
        <select value={feature.props.status} onChange={(e) => updateProps({ status: e.target.value as StatusName })}>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </Field>
      {feature.type === 'line' && (
        <LineFields
          feature={feature}
          network={network}
          updateProps={updateProps}
          geometryEditing={geometryEditing}
          onOpenFiberTable={onOpenFiberTable}
          onTraceFlow={onTraceFlow}
        />
      )}
      {feature.type === 'join' && (
        <JoinFields feature={feature} network={network} updateProps={updateProps} onOpenMatrix={onOpenMatrix} />
      )}
      <ReadOnlyField label="Network" value={u.label} />
      <div className="attr-actions">
        <button
          type="button"
          className="btn danger"
          onClick={() => {
            networkDispatch({ type: 'DELETE_FEATURE', util: feature.util, id: feature.id });
            uiDispatch({ type: 'DESELECT' });
          }}
        >
          Delete
        </button>
        <button type="button" className="btn" onClick={() => uiDispatch({ type: 'DESELECT' })}>
          Done
        </button>
      </div>
    </>
  );
}
