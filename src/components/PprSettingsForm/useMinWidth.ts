import { RefObject, useLayoutEffect, useState } from 'react';

/**
 * Whether the element is at least `minWidth` pixels wide, updated when it
 * is resized. Measured before the first paint, so a layout depending on it
 * doesn't jump. False without a measurement (no ResizeObserver: tests, old
 * browsers measure once).
 */
const useMinWidth = (ref: RefObject<HTMLElement | null>, minWidth: number): boolean => {
  const [fits, setFits] = useState(false);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) {
      return undefined;
    }
    const update = (width: number) => setFits(width >= minWidth);
    update(element.getBoundingClientRect().width);

    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    const observer = new ResizeObserver(entries => {
      if (entries.length > 0) {
        update(entries[0].contentRect.width);
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, minWidth]);

  return fits;
};

export default useMinWidth;
