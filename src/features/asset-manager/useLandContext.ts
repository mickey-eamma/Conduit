import { useState } from 'react';

export interface LandContext {
  site: string;
  lease: string;
}

export interface UseLandContextResult {
  landCtx: LandContext;
  setSite: (code: string) => void;
  setLease: (code: string) => void;
}

/** The chosen parent Site (for a new lease) / Lease (for a new building) — ephemeral UI state, mirrors main's `landCtx`. */
export function useLandContext(): UseLandContextResult {
  const [landCtx, setLandCtx] = useState<LandContext>({ site: '', lease: '' });
  return {
    landCtx,
    setSite: (code) => setLandCtx((c) => ({ ...c, site: code })),
    setLease: (code) => setLandCtx((c) => ({ ...c, lease: code })),
  };
}
