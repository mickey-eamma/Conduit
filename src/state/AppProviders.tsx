import type { ReactNode } from 'react';
import { UiProvider } from './ui/UiContext';
import { NetworkProvider } from './network/NetworkContext';

// Additional slices (Auth, Client, Builder, Crossings) are nested here as
// their phases land — see the migration plan for the full nesting order:
// Auth > Client > Ui > Network > Builder > Crossings.
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <UiProvider>
      <NetworkProvider>{children}</NetworkProvider>
    </UiProvider>
  );
}
