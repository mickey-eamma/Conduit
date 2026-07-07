import type { BasemapId, StatusName, ToolId, UtilId } from './types';

export const GLYPH: Record<UtilId, string> = {
  telecom:
    '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M6.5 6.5a8 8 0 0 0 0 11M17.5 6.5a8 8 0 0 1 0 11M4 4a12 12 0 0 0 0 16M20 4a12 12 0 0 1 0 16"/></svg>',
  water: '<svg viewBox="0 0 24 24"><path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11Z"/></svg>',
  electric: '<svg viewBox="0 0 24 24"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/></svg>',
  oilgas:
    '<svg viewBox="0 0 24 24"><path d="M5 21V8l5-3 5 3v13"/><path d="M3 21h18M9 12h2M9 16h2"/><path d="M15 11h3a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2"/></svg>',
};

export interface UtilTerms {
  line: string;
  source: string;
  join: string;
  delivery: string;
}

export interface UtilDef {
  label: string;
  color: string;
  abbr: string;
  terms: UtilTerms;
}

export const UTILS: Record<UtilId, UtilDef> = {
  telecom: {
    label: 'Telecom',
    color: '#7c4ddb',
    abbr: 'TEL',
    terms: { line: 'Fiber cable', source: 'Central office / headend', join: 'Splice point', delivery: 'Service drop' },
  },
  water: {
    label: 'Water',
    color: '#0891b2',
    abbr: 'WTR',
    terms: { line: 'Water main', source: 'Treatment plant / pump', join: 'Valve / fitting', delivery: 'Service meter' },
  },
  electric: {
    label: 'Electric',
    color: '#e08700',
    abbr: 'ELC',
    terms: {
      line: 'Distribution line',
      source: 'Substation / generation',
      join: 'Transformer / junction',
      delivery: 'Service meter',
    },
  },
  oilgas: {
    label: 'Oil & Gas',
    color: '#e11d48',
    abbr: 'OIL',
    terms: { line: 'Pipeline', source: 'Wellhead / refinery', join: 'Joint / fitting', delivery: 'City gate / delivery' },
  },
};

export const ORDER: UtilId[] = ['telecom', 'water', 'electric', 'oilgas'];

export const ROLEABBR: Record<'line' | 'source' | 'join' | 'delivery', string> = {
  line: 'LN',
  source: 'SRC',
  join: 'JN',
  delivery: 'DLV',
};

export const STATUSES: StatusName[] = ['Active', 'Construction', 'Planned', 'Abandoned'];

export const STATUS_COLOR: Record<StatusName, string> = {
  Active: '#16a34a',
  Construction: '#ea580c',
  Planned: '#2563eb',
  Abandoned: '#9aa1ad',
};

export const STATUS_DASH: Record<StatusName, string | null> = {
  Active: null,
  Construction: '2 6',
  Planned: '9 7',
  Abandoned: '7 7',
};

export const STATUS_OPACITY: Record<StatusName, number> = {
  Active: 0.95,
  Construction: 0.92,
  Planned: 0.85,
  Abandoned: 0.5,
};

/** Common fiber-cable strand counts (telecom). */
export const FIBER_COUNTS = [2, 4, 6, 12, 24, 48, 72, 96, 144, 216, 288];

/** TIA-598 fiber color order (repeats every 12). */
export const FIBER_COLORS = [
  '#1f6feb', '#ff8a1e', '#1fa83a', '#7a4a1e', '#8a93a0', '#f4f4f4',
  '#e0212c', '#222222', '#f4c20d', '#7e2fd0', '#ff77b0', '#37c7c0',
];

export const FIBER_NAMES = [
  'Blue', 'Orange', 'Green', 'Brown', 'Slate', 'White',
  'Red', 'Black', 'Yellow', 'Violet', 'Rose', 'Aqua',
];

export function fiberColor(n: number): string {
  return FIBER_COLORS[(n - 1) % 12];
}

export function fiberName(n: number): string {
  return FIBER_NAMES[(n - 1) % 12];
}

export interface ToolDef {
  icon: string;
  label: string;
  role: 'line' | 'source' | 'join' | 'delivery' | null;
}

export const TOOLS: Record<ToolId, ToolDef> = {
  pan: { icon: '<path d="M3 3l7.5 18 2.3-7.2L20 11.5 3 3Z"/>', label: 'Select', role: null },
  line: {
    icon:
      '<circle cx="5" cy="19" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="13" cy="13" r="1.6"/><path d="M6.4 17.6 11.6 12.4M14.4 11.6 17.6 6.4"/>',
    label: 'Draw',
    role: 'line',
  },
  source: { icon: '<path d="M12 4 18 10 12 16 6 10Z"/>', label: 'Place', role: 'source' },
  join: { icon: '<circle cx="12" cy="12" r="5"/>', label: 'Place', role: 'join' },
  delivery: { icon: '<rect x="6" y="6" width="12" height="12" rx="2"/>', label: 'Place', role: 'delivery' },
  delete: {
    icon:
      '<path d="M5 7h14M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    label: 'Delete feature',
    role: null,
  },
};

export interface TileLayerDef {
  url: string;
  options: Record<string, unknown>;
}

export const BASEMAPS: Record<BasemapId, { layers: [string, Record<string, unknown>][] }> = {
  gray: {
    layers: [
      [
        'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors',
          maxNativeZoom: 16,
          maxZoom: 19,
        },
      ],
      [
        'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        { maxNativeZoom: 16, maxZoom: 19 },
      ],
    ],
  },
  streets: {
    layers: [
      [
        'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
        { attribution: 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors', maxZoom: 19 },
      ],
    ],
  },
  imagery: {
    layers: [
      [
        'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics', maxZoom: 19 },
      ],
    ],
  },
};

export interface WidgetDef {
  label: string;
  desc: string;
  single: boolean;
  icon: string;
}

export const WIDGET_DEFS: Record<
  'text' | 'legend' | 'layerlist' | 'scalebar' | 'northarrow' | 'fibertools' | 'pipeflow',
  WidgetDef
> = {
  text: { label: 'Text', desc: 'Free-form annotation', single: false, icon: '<path d="M5 6h14M12 6v13"/>' },
  legend: {
    label: 'Legend',
    desc: 'Auto layer key',
    single: true,
    icon:
      '<circle cx="6" cy="7" r="1.7"/><path d="M11 7h8"/><circle cx="6" cy="12" r="1.7"/><path d="M11 12h8"/><circle cx="6" cy="17" r="1.7"/><path d="M11 17h8"/>',
  },
  layerlist: {
    label: 'Layer list',
    desc: 'Toggle layers in the app',
    single: true,
    icon: '<path d="M12 3 21 8 12 13 3 8Z"/><path d="M3 13l9 5 9-5"/>',
  },
  scalebar: {
    label: 'Scale bar',
    desc: 'Live map scale',
    single: true,
    icon: '<path d="M4 9v7M20 9v7M4 12.5h16M9 10.5v4M14 10.5v4"/>',
  },
  northarrow: {
    label: 'North arrow',
    desc: 'Orientation marker',
    single: true,
    icon: '<circle cx="12" cy="12" r="8.5"/><path d="M12 6.5 15 16l-3-2.2L9 16Z"/>',
  },
  fibertools: {
    label: 'Fiber tools',
    desc: 'Splice matrix & signal trace',
    single: true,
    icon:
      '<circle cx="5" cy="6" r="1.5"/><circle cx="5" cy="12" r="1.5"/><circle cx="5" cy="18" r="1.5"/><circle cx="19" cy="9" r="1.5"/><circle cx="19" cy="15" r="1.5"/><path d="M6.5 6C11 6 14 9 17.5 9M6.5 12h11M6.5 18C11 18 14 15 17.5 15"/>',
  },
  pipeflow: {
    label: 'Pipe flow',
    desc: 'Trace up/downstream pipes',
    single: true,
    icon: '<path d="M4 12h5l3-6 4 12 3-6h1"/>',
  },
};

export const AGS_PALETTE = [
  '#2563eb', '#db2777', '#059669', '#d97706', '#7c3aed', '#0d9488', '#dc2626', '#4338ca',
];

export const POPUP_FIELDS: [string, string][] = [
  ['code', 'Asset code'],
  ['type', 'Type & network'],
  ['status', 'Status'],
  ['length', 'Length'],
  ['fiber', 'Fiber details'],
  ['links', 'Connections'],
];

export const CX_DEFAULTS = [
  {
    title: 'Rivers and Streams',
    color: '#2b7fd6',
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_Rivers_and_Streams/FeatureServer/0',
  },
  {
    title: 'Railroads',
    color: '#4b5563',
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_Railroads/FeatureServer/0',
  },
];

export function defaultLayerCfg(id: UtilId) {
  return {
    visible: true,
    color: UTILS[id].color,
    weight: 3.5,
    opacity: 1,
    popup: { enabled: true, fields: { code: true, type: true, status: true, length: true, fiber: true, links: true } },
  };
}
