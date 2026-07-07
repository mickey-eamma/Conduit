const NORTH_SVG =
  '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="none" stroke="#2c3038" stroke-width="1.6"/><path d="M16 6.5 20 22l-4-3-4 3Z" fill="#2c3038"/><path d="M16 6.5 12 22l4-3v-12.5Z" fill="#e11d48"/><text x="16" y="30.5" text-anchor="middle" font-family="Figtree,sans-serif" font-size="7" font-weight="700" fill="#2c3038">N</text></svg>';

export function NorthArrowWidget() {
  return <div className="w-north" dangerouslySetInnerHTML={{ __html: NORTH_SVG }} />;
}
