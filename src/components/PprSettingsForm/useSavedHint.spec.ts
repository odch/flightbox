import { act, renderHook } from '@testing-library/react';
import useSavedHint, { SAVED_HINT_DURATION } from './useSavedHint';

describe('useSavedHint', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('is hidden until shown', () => {
    const { result } = renderHook(() => useSavedHint());
    expect(result.current.visible).toBe(false);
  });

  it('is shown for 5 seconds', () => {
    expect(SAVED_HINT_DURATION).toBe(5000);
    const { result } = renderHook(() => useSavedHint());

    act(() => result.current.show());
    expect(result.current.visible).toBe(true);

    act(() => {
      jest.advanceTimersByTime(4999);
    });
    expect(result.current.visible).toBe(true);

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current.visible).toBe(false);
  });

  it('can be hidden before', () => {
    const { result } = renderHook(() => useSavedHint());

    act(() => result.current.show());
    act(() => result.current.hide());

    expect(result.current.visible).toBe(false);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('starts the time over when shown again', () => {
    const { result } = renderHook(() => useSavedHint(1000));

    act(() => result.current.show());
    act(() => {
      jest.advanceTimersByTime(800);
    });
    act(() => result.current.show());
    act(() => {
      jest.advanceTimersByTime(800);
    });
    expect(result.current.visible).toBe(true);

    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(result.current.visible).toBe(false);
  });

  it('stops the time when unmounted', () => {
    const { result, unmount } = renderHook(() => useSavedHint());

    act(() => result.current.show());
    unmount();

    expect(jest.getTimerCount()).toBe(0);
  });
});
