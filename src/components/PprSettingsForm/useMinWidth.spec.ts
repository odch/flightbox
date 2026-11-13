import { act, renderHook } from '@testing-library/react';
import useMinWidth from './useMinWidth';

const elementOfWidth = (width: number) =>
  ({ getBoundingClientRect: () => ({ width }) }) as unknown as HTMLElement;

describe('useMinWidth', () => {
  const originalResizeObserver = (global as any).ResizeObserver;

  afterEach(() => {
    (global as any).ResizeObserver = originalResizeObserver;
  });

  it('is true for an element at least as wide', () => {
    const ref = { current: elementOfWidth(600) };
    const { result } = renderHook(() => useMinWidth(ref, 600));
    expect(result.current).toBe(true);
  });

  it('is false for a narrower element', () => {
    const ref = { current: elementOfWidth(599) };
    const { result } = renderHook(() => useMinWidth(ref, 600));
    expect(result.current).toBe(false);
  });

  it('is false without an element', () => {
    const ref = { current: null };
    const { result } = renderHook(() => useMinWidth(ref, 600));
    expect(result.current).toBe(false);
  });

  it('follows the element when it is resized, until unmounted', () => {
    let report: (entries: { contentRect: { width: number } }[]) => void = () => undefined;
    const observe = jest.fn();
    const disconnect = jest.fn();
    (global as any).ResizeObserver = class {
      constructor(callback: typeof report) {
        report = callback;
      }
      observe = observe;
      disconnect = disconnect;
    };
    const ref = { current: elementOfWidth(500) };

    const { result, unmount } = renderHook(() => useMinWidth(ref, 600));
    expect(result.current).toBe(false);
    expect(observe).toHaveBeenCalledWith(ref.current);

    act(() => report([{ contentRect: { width: 800 } }]));
    expect(result.current).toBe(true);

    act(() => report([{ contentRect: { width: 400 } }]));
    expect(result.current).toBe(false);

    unmount();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
