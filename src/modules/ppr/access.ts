// Who can request PPR, and how. The flags are read on each call, not when
// the module is loaded, as the tests set __CONF__ per test.

export const pprEnabled = () => typeof __CONF__ !== 'undefined' && __CONF__.ppr === true;

// Requests without login, from guest sessions and logins without an email
// address: only where PPR is on, as on the server
export const pprGuestRequestsEnabled = () => pprEnabled() && __CONF__.pprGuestRequests === true;

// - member: a personal login with an email address. Its requests belong to
//   that address («Meine PPR-Anfragen»).
// - visitor: nobody is logged in. The login comes first, and offers the
//   guest session where the link carries the guest access token.
// - guest: a guest session or a login without an email address, where
//   requests without login are on. They use the form without login.
// - kiosk: no PPR at all, not even the status pages.
// - none: no PPR requests (PPR off, or a guest session or a login without
//   an email address where requests without login are off).
export type PprAccess = 'member' | 'visitor' | 'guest' | 'kiosk' | 'none';

interface PprAuth {
  authenticated?: boolean;
  // auth.data of the store, undefined without a login
  data?: unknown;
}

interface Session {
  guest?: unknown;
  kiosk?: unknown;
  email?: unknown;
}

export function getPprAccess(auth: PprAuth): PprAccess {
  if (!pprEnabled()) {
    return 'none';
  }
  if (auth.authenticated !== true) {
    return 'visitor';
  }
  const session = (auth.data || {}) as Session;
  if (session.kiosk === true) {
    return 'kiosk';
  }
  if (session.guest !== true && !!session.email) {
    return 'member';
  }
  return pprGuestRequestsEnabled() ? 'guest' : 'none';
}
