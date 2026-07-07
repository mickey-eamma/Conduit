import { useEffect, useRef } from 'react';
import type { Widget } from '../../../domain/types';

interface TextWidgetProps {
  widget: Widget;
  onTextChange: (text: string) => void;
}

/** Editable annotation box. Content is DOM-owned (like the original's contentEditable div) so React never fights the user's cursor while typing. */
export function TextWidget({ widget, onTextChange }: TextWidgetProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.textContent = widget.text ?? '';
    // eslint-disable-next-line react-hooks/exhaustive-deps -- set initial content once; further edits are user/DOM-driven
  }, []);

  return (
    <div
      ref={ref}
      className="w-text"
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      style={{ fontSize: widget.fontSize }}
      onInput={(e) => onTextChange((e.currentTarget as HTMLDivElement).innerText)}
    />
  );
}
