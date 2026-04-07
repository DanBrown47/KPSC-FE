import { useState, useCallback } from 'react';

/**
 * Persists card/list view preference per page in localStorage.
 * @param {string} pageKey - unique key, e.g. 'agenda' or 'meetings'
 * @param {'card'|'list'} defaultMode
 */
export const useViewPreference = (pageKey, defaultMode = 'card') => {
  const storageKey = `viewMode_${pageKey}`;
  const [viewMode, setViewModeState] = useState(
    () => localStorage.getItem(storageKey) || defaultMode
  );

  const setViewMode = useCallback((mode) => {
    localStorage.setItem(storageKey, mode);
    setViewModeState(mode);
  }, [storageKey]);

  return { viewMode, setViewMode };
};
