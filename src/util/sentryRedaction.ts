import type { Breadcrumb, ErrorEvent } from '@sentry/react';

// A status link lets whoever holds it see and withdraw a PPR request
// (#/ppr/status/<key>/<token>). Sentry keeps the fragment of URLs in events
// and breadcrumbs (urlQueryParams: false covers the query only), so the key
// and the token are cut out before they leave the browser. The status
// page's API calls (/ppr/status/<key>[/withdraw]) are cut the same way.
const PPR_STATUS_PATH = /(\/ppr\/status\/)[^\s?#"'<>]*/gi;

export const redactPprStatusLinks = (text: string) => text.replace(PPR_STATUS_PATH, '$1[Filtered]');

const redactValue = (value: unknown) => typeof value === 'string' ? redactPprStatusLinks(value) : value;

// The URL of the page the error happened on
export function redactEvent(event: ErrorEvent): ErrorEvent {
  if (!event.request || typeof event.request.url !== 'string') {
    return event;
  }
  return { ...event, request: { ...event.request, url: redactPprStatusLinks(event.request.url) } };
}

// The URLs of navigations (data.from, data.to) and of API calls (data.url),
// and messages logged to the console
export function redactBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
  const redacted = { ...breadcrumb };
  if (typeof breadcrumb.message === 'string') {
    redacted.message = redactPprStatusLinks(breadcrumb.message);
  }
  if (breadcrumb.data) {
    redacted.data = Object.fromEntries(
      Object.entries(breadcrumb.data).map(([key, value]) => [key, redactValue(value)])
    );
  }
  return redacted;
}
