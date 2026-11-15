// Short links for other websites, e.g. <appUrl>/ppr on an aerodrome's
// website. Hosting serves the app for every path, but the app routes in the
// fragment (hash history), so the path has to become the hash route before
// the history reads the location: it never sees a later replaceState.
const SHORT_LINKS: Record<string, string> = {
  '/ppr': '/ppr/new',
};

interface LocationLike {
  pathname: string;
  hash: string;
}

// The URL a short link stands for, or null for any other URL. A route in
// the fragment wins, e.g. when a page opened from the short link is
// reloaded after the app navigated on.
export function resolveShortLink({ pathname, hash }: LocationLike): string | null {
  const target = SHORT_LINKS[pathname.replace(/\/+$/, '').toLowerCase()];
  if (!target || (hash !== '' && hash !== '#/')) {
    return null;
  }
  return `/#${target}`;
}

export function applyShortLink(win: Window = window): void {
  const url = resolveShortLink(win.location);
  if (url) {
    win.history.replaceState(win.history.state, '', url);
  }
}
