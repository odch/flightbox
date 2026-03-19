const RELOAD_COOLDOWN_MS = 5000;
const STORAGE_KEY = 'sw-reload-ts';

export function shouldReloadOnControllerChange(): boolean {
  try {
    const lastReload = Number(sessionStorage.getItem(STORAGE_KEY) || 0);
    return Date.now() - lastReload > RELOAD_COOLDOWN_MS;
  } catch {
    return true;
  }
}

export function markReload(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}
