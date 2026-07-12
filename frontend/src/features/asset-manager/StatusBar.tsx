import { UTILS } from '../../domain/constants';
import type { ToolId, UtilId } from '../../domain/types';
import { toolStatusLabel } from './hintText';

interface StatusBarProps {
  util: UtilId;
  tool: ToolId;
  featureCount: number;
  coords: string;
}

export function StatusBar({ util, tool, featureCount, coords }: StatusBarProps) {
  return (
    <div className="statusbar">
      <div className="seg">
        <span className="swatch" style={{ background: UTILS[util].color }} />
        <span className="v">{UTILS[util].label}</span>
      </div>
      <div className="seg">Tool: <span className="v">{toolStatusLabel(tool, util)}</span></div>
      <div className="spacer" />
      <div className="seg">Features: <span className="v tnum">{featureCount}</span></div>
      <div className="seg coords">Lat/Lng: <span className="v tnum">{coords}</span></div>
    </div>
  );
}
