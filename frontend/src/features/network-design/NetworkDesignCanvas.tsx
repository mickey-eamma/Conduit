import type { RefObject } from 'react';

interface NetworkDesignCanvasProps {
  containerRef: RefObject<HTMLDivElement | null>;
  hint: string;
}

export function NetworkDesignCanvas({ containerRef, hint }: NetworkDesignCanvasProps) {
  return (
    <main className="nd-canvas">
      <div id="ndmap" ref={containerRef} />
      <div className="nd-hint" id="ndHint">
        {hint}
      </div>
    </main>
  );
}
