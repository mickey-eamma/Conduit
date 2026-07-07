import { hintText } from './hintText';
import type { ToolId, UtilId } from '../../domain/types';

interface HintPillProps {
  tool: ToolId;
  util: UtilId;
}

export function HintPill({ tool, util }: HintPillProps) {
  return (
    <div className="hint">
      <span className="dot" />
      <span>{hintText(tool, util)}</span>
    </div>
  );
}
