import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

export const useUnsavedWarning = (isDirty) => {
  // Warn on browser close/refresh
  useEffect(() => {
    const handler = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Block in-app navigation
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  const confirmNavigation = () => {
    if (blocker.state === 'blocked') {
      blocker.proceed();
    }
  };

  const cancelNavigation = () => {
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  };

  return {
    isBlocked: blocker.state === 'blocked',
    confirmNavigation,
    cancelNavigation,
  };
};
