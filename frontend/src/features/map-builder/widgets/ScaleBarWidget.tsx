import { useEffect, useState, type RefObject } from 'react';
import type L from 'leaflet';
import { niceScale, type ScaleReading } from '../../../leaflet/niceScale';

const MAX_PX = 120;

interface ScaleBarWidgetProps {
  mapRef: RefObject<L.Map | null>;
}

export function ScaleBarWidget({ mapRef }: ScaleBarWidgetProps) {
  const [scale, setScale] = useState<ScaleReading>({ px: MAX_PX, label: '' });

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    function update() {
      if (map) setScale(niceScale(map, MAX_PX));
    }
    update();
    map.on('zoomend moveend', update);
    return () => {
      map.off('zoomend moveend', update);
    };
  }, [mapRef]);

  return (
    <div className="w-scale">
      <div className="ws-bar" style={{ width: scale.px }} />
      <div className="ws-lab">{scale.label}</div>
    </div>
  );
}
