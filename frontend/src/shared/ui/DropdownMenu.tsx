import { useEffect, useRef, useState, type ReactNode } from 'react';

interface DropdownMenuProps {
  trigger: ReactNode;
  triggerClassName?: string;
  children: ReactNode;
}

/**
 * Generic app-bar dropdown: click the trigger to open, click any menu item
 * (or click outside, or press Escape) to close. Mirrors main's `initMenus`
 * (`closeMenus` on outside-click/Escape/any `.menu-item` click).
 */
export function DropdownMenu({ trigger, triggerClassName, children }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="menu-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`btn cb-btn menu-btn${triggerClassName ? ` ${triggerClassName}` : ''}`}
        onClick={() => setOpen((o) => !o)}
      >
        {trigger}
      </button>
      {open && (
        <div className="menu" onClick={() => setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  );
}
