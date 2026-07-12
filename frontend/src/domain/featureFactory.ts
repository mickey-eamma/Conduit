import { ROLEABBR, UTILS } from './constants';
import { isFlowNet } from './flow';
import type { Feature, FeatureProps, FeatureType, UtilId } from './types';

/**
 * Pure equivalent of the original app's `newFeature()`. Given the next uid,
 * returns a brand-new feature (without geometry — the caller attaches
 * `latlngs`/`latlng`) and the uid to store back in state for next time.
 */
export function createFeature(
  type: FeatureType,
  util: UtilId,
  uid: number,
): { feature: Omit<Feature, 'latlngs' | 'latlng'>; nextUid: number } {
  const code = `${UTILS[util].abbr}-${ROLEABBR[type]}-${String(uid).padStart(3, '0')}`;
  const props: FeatureProps = { name: '', status: 'Active' };

  if (type === 'line' && util === 'telecom') {
    props.fiberCount = 48;
    props.placement = 'Aerial';
  }
  if (type === 'join') {
    if (util === 'telecom') {
      props.parentLine = '';
      props.branches = [];
      props.splices = [];
    } else if (isFlowNet(util)) {
      props.fromLine = '';
      props.toLines = [];
    } else {
      props.fromLine = '';
      props.toLine = '';
    }
  }
  if (type === 'lease') props.parentSite = '';
  if (type === 'building') {
    props.parentLease = '';
    props.parentSite = '';
  }

  return {
    feature: { id: String(uid), type, util, code, props } as Omit<Feature, 'latlngs' | 'latlng'>,
    nextUid: uid + 1,
  };
}
