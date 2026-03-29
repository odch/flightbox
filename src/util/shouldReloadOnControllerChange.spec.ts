import { shouldReloadOnControllerChange, markReload } from './shouldReloadOnControllerChange';

describe('shouldReloadOnControllerChange', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('should return true when no previous reload timestamp', () => {
    expect(shouldReloadOnControllerChange()).toBe(true);
  });

  it('should return false when last reload was < 5s ago', () => {
    sessionStorage.setItem('sw-reload-ts', String(Date.now()));
    expect(shouldReloadOnControllerChange()).toBe(false);
  });

  it('should return true when last reload was > 5s ago', () => {
    sessionStorage.setItem('sw-reload-ts', String(Date.now() - 6000));
    expect(shouldReloadOnControllerChange()).toBe(true);
  });

  it('should return true when sessionStorage throws', () => {
    const originalGetItem = sessionStorage.getItem;
    sessionStorage.getItem = () => { throw new Error('denied'); };
    expect(shouldReloadOnControllerChange()).toBe(true);
    sessionStorage.getItem = originalGetItem;
  });
});

describe('markReload', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('should store timestamp in sessionStorage', () => {
    markReload();
    const stored = Number(sessionStorage.getItem('sw-reload-ts'));
    expect(stored).toBeGreaterThan(0);
    expect(Date.now() - stored).toBeLessThan(1000);
  });
});
