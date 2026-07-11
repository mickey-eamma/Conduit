import { useEffect } from 'react';
import { useUi } from '../../state/ui/UiContext';

const AUTO_DISMISS_MS = 2200;

export function Toast() {
  const { state, dispatch } = useUi();
  const toast = state.toast;

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => dispatch({ type: 'DISMISS_TOAST' }), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast, dispatch]);

  return <div className={`toast${toast ? ' show' : ''}`}>{toast?.message ?? ''}</div>;
}
