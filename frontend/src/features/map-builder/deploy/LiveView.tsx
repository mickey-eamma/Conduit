import { useEffect, useState } from 'react';
import { loadClients } from '../../../lib/persistence';
import { Store } from '../../../lib/store';
import { makePayload } from './deployPayload';
import type { DeployComposition } from './deployTypes';
import { viewerHtmlFromPayload } from './deployViewerHtml';

const DEPLOY_PREFIX = 'conduit:deploy:';

interface LiveViewProps {
  name: string;
}

type LiveViewState = { kind: 'loading' } | { kind: 'missing' } | { kind: 'ready'; html: string };

/**
 * Mirrors the original's `renderLiveView` — a `?view=<client>` link renders
 * this client's currently saved data as a full-page read-only map, re-read
 * from this browser's storage on every load (so edits show up after a
 * refresh, unlike the frozen static-snapshot deploy path).
 */
export function LiveView({ name }: LiveViewProps) {
  const [state, setState] = useState<LiveViewState>({ kind: 'loading' });

  useEffect(() => {
    document.title = `${name} — Asset Map`;
    let cancelled = false;
    (async () => {
      const clients = await loadClients();
      const proj = clients[name];
      if (!proj) {
        if (!cancelled) setState({ kind: 'missing' });
        return;
      }
      let comp: (Partial<DeployComposition> & { generated?: string }) | undefined;
      try {
        const raw = await Store.get(DEPLOY_PREFIX + name);
        if (raw) comp = JSON.parse(raw);
      } catch {
        /* fall back to defaults */
      }
      const html = viewerHtmlFromPayload(makePayload(name, proj.networks, comp));
      if (!cancelled) setState({ kind: 'ready', html });
    })();
    return () => {
      cancelled = true;
    };
  }, [name]);

  if (state.kind === 'loading') return null;

  if (state.kind === 'missing') {
    return (
      <div
        style={{
          fontFamily: 'system-ui,sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          padding: 24,
          color: '#2c3038',
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 8px' }}>No saved data for “{name}”.</h2>
          <p style={{ color: '#6c7480', maxWidth: 420 }}>
            A live asset map reads from the browser where the client was saved. Open this link in that browser, or deploy again after
            saving the client.
          </p>
        </div>
      </div>
    );
  }

  return (
    <iframe
      title={`${name} — Asset Map`}
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 0 }}
      srcDoc={state.html}
    />
  );
}
