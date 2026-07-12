import { fmtArea, polyArea } from '../../../domain/landStyle';
import { ReadOnlyField } from '../../../shared/ui/Field';
import { landByCode, landFeatsByType } from '../../../state/network/networkSelectors';
import type { FeatureProps, PolygonFeature } from '../../../domain/types';
import type { NetworkState } from '../../../state/network/networkTypes';

interface PolygonFieldsProps {
  feature: PolygonFeature;
  network: NetworkState;
  updateProps: (props: Partial<FeatureProps>) => void;
}

export function PolygonFields({ feature, network, updateProps }: PolygonFieldsProps) {
  return (
    <>
      <ReadOnlyField label="Area" value={fmtArea(polyArea(feature.latlngs))} />
      {feature.type === 'lease' && <LeaseRelations feature={feature} network={network} updateProps={updateProps} />}
      {feature.type === 'building' && <BuildingRelations feature={feature} network={network} updateProps={updateProps} />}
      {feature.type === 'site' && <SiteRelations feature={feature} network={network} />}
    </>
  );
}

function LeaseRelations({ feature, network, updateProps }: PolygonFieldsProps) {
  const sites = landFeatsByType(network, 'site');
  const parentSite = feature.props.parentSite && landByCode(network, feature.props.parentSite) ? feature.props.parentSite : '';
  const buildingCount = landFeatsByType(network, 'building').filter((b) => b.props.parentLease === feature.code).length;

  return (
    <div className="rel-block">
      <div className="field">
        <label>Parent Site</label>
        <select value={parentSite} onChange={(e) => updateProps({ parentSite: e.target.value })}>
          <option value="">— none —</option>
          {sites.map((s) => (
            <option key={s.code} value={s.code}>
              {s.props.name || s.code}
            </option>
          ))}
        </select>
      </div>
      {!parentSite && <div className="rel-warn">This lease isn’t associated with a Site.</div>}
      <div className="rel-hint">
        {buildingCount} building{buildingCount !== 1 ? 's' : ''} inside this lease.
      </div>
    </div>
  );
}

function BuildingRelations({ feature, network, updateProps }: PolygonFieldsProps) {
  const leases = landFeatsByType(network, 'lease');
  const parentLease = feature.props.parentLease && landByCode(network, feature.props.parentLease) ? feature.props.parentLease : '';
  const site = feature.props.parentSite ? landByCode(network, feature.props.parentSite) : undefined;

  return (
    <div className="rel-block">
      <div className="field">
        <label>Parent Lease</label>
        <select
          value={parentLease}
          onChange={(e) => {
            const nextLease = e.target.value;
            const lease = nextLease ? landByCode(network, nextLease) : undefined;
            updateProps({ parentLease: nextLease, parentSite: lease?.props.parentSite || '' });
          }}
        >
          <option value="">— none —</option>
          {leases.map((l) => (
            <option key={l.code} value={l.code}>
              {l.props.name || l.code}
            </option>
          ))}
        </select>
      </div>
      <ReadOnlyField label="Site" value={site ? site.props.name || site.code : '—'} />
      {!parentLease && <div className="rel-warn">This building isn’t associated with a Lease.</div>}
    </div>
  );
}

function SiteRelations({ feature, network }: { feature: PolygonFeature; network: NetworkState }) {
  const leaseCount = landFeatsByType(network, 'lease').filter((l) => l.props.parentSite === feature.code).length;
  return (
    <div className="rel-block">
      <div className="rel-hint">
        {leaseCount} lease{leaseCount !== 1 ? 's' : ''} inside this site.
      </div>
    </div>
  );
}
