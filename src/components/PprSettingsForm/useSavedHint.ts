import { useCallback, useEffect, useState } from 'react';

// Long enough to be noticed, short enough not to describe an old save
export const SAVED_HINT_DURATION = 5000;

/**
 * Whether to confirm that something was saved: from show() until hide() or
 * for `duration` milliseconds; show() again starts the time over. Used by
 * the component that saves, so the hint lasts when it switches what it
 * shows (from the form to the summary).
 */
const useSavedHint = (duration = SAVED_HINT_DURATION) => {
  // 0 while hidden, counted up by each show() to start the time over
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (shown === 0) {
      return undefined;
    }
    const timer = setTimeout(() => setShown(0), duration);
    return () => clearTimeout(timer);
  }, [shown, duration]);

  const show = useCallback(() => setShown(count => count + 1), []);
  const hide = useCallback(() => setShown(0), []);

  return { visible: shown > 0, show, hide };
};

export default useSavedHint;
