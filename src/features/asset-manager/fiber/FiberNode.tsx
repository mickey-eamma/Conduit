import type { PointerEvent } from 'react';
import { fiberColor, fiberName } from '../../../domain/constants';

interface FiberNodeProps {
  side: 'in' | 'out';
  line: string | null;
  fiber: number;
  armed: boolean;
  connected: boolean;
  nodeRef: (el: HTMLDivElement | null) => void;
  onPointerDown: (e: PointerEvent<HTMLDivElement>) => void;
}

export function FiberNode({ side, fiber, armed, connected, nodeRef, onPointerDown }: FiberNodeProps) {
  const dot = <span className="fib-dot" style={{ background: fiberColor(fiber) }} />;
  const no = <span className="fib-no">{fiber}</span>;
  const name = <span className="fib-nm">{fiberName(fiber)}</span>;

  return (
    <div
      ref={nodeRef}
      className={`fib${connected ? ' on' : ''}${armed ? ' armed' : ''}`}
      onPointerDown={onPointerDown}
    >
      {side === 'in' ? (
        <>
          {name}
          {no}
          {dot}
        </>
      ) : (
        <>
          {dot}
          {no}
          {name}
        </>
      )}
    </div>
  );
}
