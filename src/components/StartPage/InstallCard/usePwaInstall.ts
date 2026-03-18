import { useState, useEffect, useRef, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type Platform = 'chromium' | 'ios-safari' | null;

interface PwaInstallResult {
  shouldShow: boolean;
  platform: Platform;
  install: () => void;
  dismiss: () => void;
}

interface AuthData {
  guest?: boolean;
  kiosk?: boolean;
  uid?: string;
}

const VISIT_DAYS_KEY = 'flightbox_pwa_visit_days';
const DISMISS_TS_KEY = 'flightbox_pwa_dismiss_ts';
const DISMISS_COUNT_KEY = 'flightbox_pwa_dismiss_count';
const VISIT_THRESHOLD = 3;
const DISMISS_DAYS = 90;

let cachedPromptEvent: BeforeInstallPromptEvent | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    cachedPromptEvent = e as BeforeInstallPromptEvent;
  });
}

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as any).standalone === true;
}

function detectPlatform(promptAvailable: boolean): Platform {
  if (isStandalone()) return null;

  if (promptAvailable) return 'chromium';

  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS) {
    const isInAppBrowser = /CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
    if (!isInAppBrowser && /Safari/.test(ua)) return 'ios-safari';
    return null;
  }

  // macOS Safari 17+
  const safariMatch = ua.match(/Version\/(\d+).*Safari/);
  if (safariMatch && parseInt(safariMatch[1], 10) >= 17 && !/Chrome|Chromium/.test(ua)) {
    return 'ios-safari'; // Same manual install flow
  }

  return null;
}

function recordVisitDay(): string[] {
  const today = new Date().toISOString().slice(0, 10);
  let days: string[] = [];
  try {
    days = JSON.parse(localStorage.getItem(VISIT_DAYS_KEY) || '[]');
  } catch { /* empty */ }

  if (!days.includes(today)) {
    days.push(today);
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  days = days.filter(d => d >= cutoffStr);

  localStorage.setItem(VISIT_DAYS_KEY, JSON.stringify(days));
  return days;
}

function isDismissed(): boolean {
  const count = parseInt(localStorage.getItem(DISMISS_COUNT_KEY) || '0', 10);
  if (count >= 2) return true;

  if (count === 1) {
    const ts = parseInt(localStorage.getItem(DISMISS_TS_KEY) || '0', 10);
    const daysSince = (Date.now() - ts) / (1000 * 60 * 60 * 24);
    if (daysSince < DISMISS_DAYS) return true;
  }

  return false;
}

function isEligibleUser(authData: AuthData): boolean {
  if (!authData) return false;
  if (authData.guest || authData.kiosk) return false;
  if (authData.uid === 'ipauth') return false;
  return true;
}

export function usePwaInstall(authData: AuthData): PwaInstallResult {
  const [promptAvailable, setPromptAvailable] = useState(cachedPromptEvent !== null);
  const [dismissed, setDismissed] = useState(false);
  const promptRef = useRef<BeforeInstallPromptEvent | null>(cachedPromptEvent);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      promptRef.current = event;
      cachedPromptEvent = event;
      setPromptAvailable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const visitDays = recordVisitDay();
  const platform = detectPlatform(promptAvailable);
  const eligible = isEligibleUser(authData);
  const enoughVisits = visitDays.length >= VISIT_THRESHOLD;

  const shouldShow = eligible
    && !isStandalone()
    && platform !== null
    && enoughVisits
    && !isDismissed()
    && !dismissed;

  const install = useCallback(() => {
    if (promptRef.current) {
      promptRef.current.prompt();
      promptRef.current.userChoice.then(result => {
        if (result.outcome === 'accepted') {
          setDismissed(true);
        }
      });
    }
  }, []);

  const dismiss = useCallback(() => {
    const count = parseInt(localStorage.getItem(DISMISS_COUNT_KEY) || '0', 10) + 1;
    localStorage.setItem(DISMISS_COUNT_KEY, String(count));
    localStorage.setItem(DISMISS_TS_KEY, String(Date.now()));
    setDismissed(true);
  }, []);

  return { shouldShow, platform, install, dismiss };
}

export function _resetCachedPromptForTesting() {
  cachedPromptEvent = null;
}

export { VISIT_DAYS_KEY, DISMISS_TS_KEY, DISMISS_COUNT_KEY };
