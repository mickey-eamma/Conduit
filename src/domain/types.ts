import type { FeatureCollection } from 'geojson';

export type UtilId = 'telecom' | 'water' | 'electric' | 'oilgas' | 'land' | 'parcel';

export type FeatureType = 'line' | 'source' | 'join' | 'delivery' | 'site' | 'lease' | 'building' | 'parcel';

export type PolyType = 'site' | 'lease' | 'building' | 'parcel';

export type ToolId = 'pan' | 'line' | 'source' | 'join' | 'delivery' | 'site' | 'lease' | 'building' | 'parcel' | 'delete';

export type StatusName = 'Active' | 'Construction' | 'Planned' | 'Abandoned';

export type PlacementType = 'Aerial' | 'Underground';

export interface LatLng {
  lat: number;
  lng: number;
}

/** One strand-range allocation from a telecom splice to an outgoing cable. `''` means "cleared, not yet set". */
export interface FiberBranch {
  line: string; // code of the outgoing cable
  from: number | '';
  to: number | '';
}

/** An explicit strand-to-strand connection made in the splice matrix. */
export interface FiberSplice {
  inFiber: number;
  outLine: string;
  outFiber: number;
}

/**
 * Shape covers all type/network combinations from the original app; a given
 * feature only uses the subset relevant to its type + util (see
 * domain/constants.ts UTILS.terms and attributeFieldsByType.ts for which
 * fields apply where).
 */
export interface FeatureProps {
  name?: string;
  status: StatusName;

  // telecom line
  fiberCount?: number;
  placement?: PlacementType;

  // telecom join (splice)
  parentLine?: string;
  branches?: FiberBranch[];
  splices?: FiberSplice[];

  // water/oilgas join (flow joint) — fromLine + many toLines
  fromLine?: string;
  toLines?: string[];

  // electric join (simple 1:1)
  toLine?: string;

  // land: lease -> parent site; building -> parent lease (+ denormalized parent site)
  parentSite?: string;
  parentLease?: string;

  // event history (line-only) — one shared asset record + any number of named stages
  asset?: AssetRecord;
  stages?: EventStage[];
}

export interface AssetRecord {
  assetName: string;
  projectNo: string;
  projectDate: string;
  manufacturer: string;
  description: string;
}

export interface EventRecord {
  no: string;
  title: string;
  date: string;
  desc: string;
}

export interface EventStage {
  name: string;
  events: EventRecord[];
}

interface BaseFeature {
  id: string;
  util: UtilId;
  code: string;
  props: FeatureProps;
}

export interface LineFeature extends BaseFeature {
  type: 'line';
  latlngs: LatLng[];
}

export interface PointFeature extends BaseFeature {
  type: 'source' | 'join' | 'delivery';
  latlng: LatLng;
}

export interface PolygonFeature extends BaseFeature {
  type: PolyType;
  latlngs: LatLng[];
}

export type Feature = LineFeature | PointFeature | PolygonFeature;

export function isPolygonFeature(f: Feature): f is PolygonFeature {
  return f.type !== 'line' && 'latlngs' in f;
}

export interface RiserPoint {
  id: string;
  latlng: LatLng;
}

export interface NetworkBucket {
  visible: boolean;
  features: Feature[];
}

export type NetworksData = Record<UtilId, NetworkBucket>;

export interface ArcgisLayerRecord {
  id: string;
  title: string;
  url: string;
  color: string;
  visible: boolean;
  kind: 'features' | 'tiles';
  geojson?: FeatureCollection;
  tileUrl?: string;
  tileAttribution?: string;
}

export interface Widget {
  id: string;
  type: 'text' | 'legend' | 'layerlist' | 'scalebar' | 'northarrow' | 'fibertools' | 'pipeflow';
  x: number; // 0..1 fraction of canvas width
  y: number; // 0..1 fraction of canvas height
  text?: string;
  fontSize?: number;
}

export interface BuilderLayerCfg {
  visible: boolean;
  color: string;
  weight: number;
  opacity: number;
  popup: {
    enabled: boolean;
    fields: { code: boolean; type: boolean; status: boolean; length: boolean; fiber: boolean; links: boolean };
  };
}

export type BasemapId = 'gray' | 'streets' | 'imagery';

export interface ClientProject {
  uid: number;
  networks: Record<UtilId, { features: Feature[] }>;
  savedAt: string;
}

export interface AuthUser {
  u: string;
  p: string;
  role: 'admin' | 'user';
}
