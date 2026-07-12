import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './styles/index.css';
import App from './App';
import { LiveView } from './features/map-builder/deploy/LiveView';
import { AppProviders } from './state/AppProviders';

// `?view=<client>` is a deployed live-view link (see useDeployAssetMap) — it renders
// only the read-only asset map, bypassing the editor app and its state providers entirely.
const viewName = new URLSearchParams(location.search).get('view');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {viewName ? (
      <LiveView name={viewName} />
    ) : (
      <AppProviders>
        <App />
      </AppProviders>
    )}
  </StrictMode>,
);
