import type { Feature } from './types';

/**
 * When a line is deleted, any join referencing its code becomes stale. The
 * original app did this cleanup inline every time the attribute panel
 * rendered ("drop stale refs"); here it's pushed to write-time in the
 * reducer instead, so it's a single always-consistent place rather than
 * scattered read-time mutation.
 */
export function pruneReferencesToLine(features: Feature[], deletedCode: string): Feature[] {
  return features.map((f) => {
    if (f.type !== 'join') return f;
    const props = { ...f.props };
    let changed = false;

    if (props.parentLine === deletedCode) {
      props.parentLine = '';
      changed = true;
    }
    if (props.fromLine === deletedCode) {
      props.fromLine = '';
      changed = true;
    }
    if (props.toLine === deletedCode) {
      props.toLine = '';
      changed = true;
    }
    if (props.toLines?.includes(deletedCode)) {
      props.toLines = props.toLines.filter((c) => c !== deletedCode);
      changed = true;
    }
    if (props.branches?.some((b) => b.line === deletedCode)) {
      props.branches = props.branches.filter((b) => b.line !== deletedCode);
      changed = true;
    }

    return changed ? { ...f, props } : f;
  });
}
