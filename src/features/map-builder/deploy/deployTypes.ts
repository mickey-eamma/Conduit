import type { FeatureCollection } from 'geojson';
import type { BasemapId, BuilderLayerCfg, UtilId, Widget } from '../../../domain/types';
import type { SerializedProject } from '../../../lib/persistence';

export interface DeployArcgisFeatureLayer {
  kind: 'features';
  title: string;
  color: string;
  visible: boolean;
  geojson: FeatureCollection;
}

export interface DeployArcgisTileLayer {
  kind: 'tiles';
  title: string;
  visible: boolean;
  tileUrl: string;
  tileOpts: Record<string, unknown>;
}

export type DeployArcgisLayer = DeployArcgisFeatureLayer | DeployArcgisTileLayer;

export interface DeployView {
  center: [number, number];
  zoom: number;
}

export interface DeployComposition {
  layers: Record<UtilId, BuilderLayerCfg>;
  basemap: BasemapId;
  widgets: Widget[];
  view: DeployView | null;
  arcgis: DeployArcgisLayer[];
}

export interface DeployPayload extends DeployComposition {
  client: string;
  generated: string;
  networks: SerializedProject['networks'];
}
