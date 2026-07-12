import type { RefObject } from 'react';

interface CrossingsCanvasProps {
  containerRef: RefObject<HTMLDivElement | null>;
}

export function CrossingsCanvas({ containerRef }: CrossingsCanvasProps) {
  return (
    <main className="cx-canvas">
      <div id="cxmap" ref={containerRef} />
    </main>
  );
}
