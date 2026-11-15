import React from 'react';
import { act, render } from '@testing-library/react';
import { unstable_HistoryRouter as HistoryRouter } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { ThemeProvider } from 'styled-components';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'de' } }),
  withTranslation: () => (Component: any) => {
    const WrappedComponent = (props: any) => (
      <Component {...props} t={(key: string) => key} />
    );
    WrappedComponent.displayName = `withTranslation(${
      Component.displayName || Component.name
    })`;
    return WrappedComponent;
  },
  Trans: ({ i18nKey }: { i18nKey: string }) => <>{i18nKey}</>,
}));

jest.mock('../MaterialIcon', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../Centered', () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));

jest.mock(
  '../../containers/LoginPageContainer',
  () => ({ __esModule: true, default: () => <div>login-page</div> })
);
jest.mock(
  '../../containers/MessagePageContainer',
  () => ({ __esModule: true, default: () => <div>message-page</div> })
);
jest.mock(
  '../../containers/StartPageContainer',
  () => ({ __esModule: true, default: () => <div>start-page</div> })
);
jest.mock(
  '../../containers/DeparturePageContainer',
  () => ({ __esModule: true, default: () => <div>departure-page</div> })
);
jest.mock(
  '../../containers/HelpPageContainer',
  () => ({ __esModule: true, default: () => <div>help-page</div> })
);
jest.mock(
  '../../containers/MovementsPageContainer',
  () => ({ __esModule: true, default: () => <div>movements-page</div> })
);
jest.mock(
  '../../containers/AdminPageContainer',
  () => ({ __esModule: true, default: () => <div>admin-page</div> })
);
jest.mock(
  '../../containers/ArrivalPageContainer',
  () => ({ __esModule: true, default: () => <div>arrival-page</div> })
);
jest.mock(
  '../../containers/ArrivalPaymentPageContainer',
  () => ({ __esModule: true, default: () => <div>arrival-payment-page</div> })
);
jest.mock(
  '../../containers/AerodromeStatusPageContainer',
  () => ({ __esModule: true, default: () => <div>aerodrome-status-page</div> })
);
jest.mock(
  '../../containers/ProfilePageContainer',
  () => ({ __esModule: true, default: () => <div>profile-page</div> })
);
jest.mock(
  '../../containers/PprRequestPageContainer',
  () => ({ __esModule: true, default: () => <div>ppr-request-page</div> })
);
jest.mock(
  '../../containers/PprStatusListContainer',
  () => ({ __esModule: true, default: () => <div>ppr-status-list</div> })
);
jest.mock(
  '../../containers/PprIntroPageContainer',
  () => ({ __esModule: true, default: () => <div>ppr-intro-page</div> })
);
jest.mock(
  '../../containers/PprGuestRequestPageContainer',
  () => ({ __esModule: true, default: () => <div>ppr-guest-request-page</div> })
);
jest.mock(
  '../../containers/PprStatusPageContainer',
  () => ({ __esModule: true, default: () => <div>ppr-status-page</div> })
);

import App from './App';

const theme: any = {
  colors: { main: '#003863', background: '#fafafa', danger: '#e00f00' },
};

type AuthProps = { initialized: boolean; authenticated?: boolean; data?: object };

const renderApp = (auth: AuthProps, initialEntries: string[] = ['/']) => {
  const history = createMemoryHistory({ initialEntries });
  const app = (appAuth: AuthProps) => (
    <ThemeProvider theme={theme}>
      <HistoryRouter history={history as any}>
        <App auth={appAuth} showLogin={false} />
      </HistoryRouter>
    </ThemeProvider>
  );
  const utils = render(app(auth));
  return { history, ...utils, rerenderWith: (nextAuth: AuthProps) => utils.rerender(app(nextAuth)) };
};

describe('<App>', () => {
  let scrollToSpy: jest.Mock;
  let originalScrollTo: typeof window.scrollTo;

  beforeEach(() => {
    originalScrollTo = window.scrollTo;
    scrollToSpy = jest.fn();
    (window as any).scrollTo = scrollToSpy;
    (global as any).__CONF__ = { profileEnabled: false };
  });

  afterEach(() => {
    (window as any).scrollTo = originalScrollTo;
  });

  describe('scroll restore', () => {
    it('scrolls to top on PUSH navigation', () => {
      const { history } = renderApp({ initialized: true, authenticated: true });
      scrollToSpy.mockClear();
      act(() => {
        history.push('/help');
      });
      expect(scrollToSpy).toHaveBeenCalledWith(0, 0);
    });

    it('scrolls to top on REPLACE navigation', () => {
      const { history } = renderApp({ initialized: true, authenticated: true });
      scrollToSpy.mockClear();
      act(() => {
        history.replace('/movements');
      });
      expect(scrollToSpy).toHaveBeenCalledWith(0, 0);
    });

    it('does not scroll on POP navigation', () => {
      const { history } = renderApp({ initialized: true, authenticated: true });
      act(() => {
        history.push('/help');
      });
      scrollToSpy.mockClear();
      act(() => {
        history.back();
      });
      expect(scrollToSpy).not.toHaveBeenCalled();
    });

    it('does not scroll on initial render', () => {
      renderApp({ initialized: true, authenticated: true });
      expect(scrollToSpy).not.toHaveBeenCalled();
    });

    it('scrolls on same-URL push (clicking nav link to current page)', () => {
      const { history } = renderApp(
        { initialized: true, authenticated: true },
        ['/movements']
      );
      scrollToSpy.mockClear();
      act(() => {
        history.push('/movements');
      });
      expect(scrollToSpy).toHaveBeenCalledWith(0, 0);
    });

    it('scrolls on query-string-only change', () => {
      const { history } = renderApp(
        { initialized: true, authenticated: true },
        ['/arrival/abc/payment']
      );
      scrollToSpy.mockClear();
      act(() => {
        history.push('/arrival/abc/payment?success=true');
      });
      expect(scrollToSpy).toHaveBeenCalledWith(0, 0);
    });
  });

  describe('auth gating', () => {
    it('renders loading indicator when auth is not initialized', () => {
      const { container } = renderApp({ initialized: false });
      expect(container.textContent).toContain('common.loading');
    });

    it('renders login page when unauthenticated on a protected route', () => {
      const { container } = renderApp(
        { initialized: true, authenticated: false },
        ['/movements']
      );
      expect(container.textContent).toContain('login-page');
    });

    it('allows unauthenticated access to /aerodrome-status', () => {
      const { container } = renderApp(
        { initialized: true, authenticated: false },
        ['/aerodrome-status']
      );
      expect(container.textContent).toContain('aerodrome-status-page');
    });

    it('renders the route target when authenticated', () => {
      const { container } = renderApp(
        { initialized: true, authenticated: true },
        ['/movements']
      );
      expect(container.textContent).toContain('movements-page');
    });

    it('keeps the location of a link through the login', () => {
      // e.g. the link to a request in the PPR notification email
      const link = '/admin?tab=ppr&request=-Nabc';
      const { history, container, rerender } = renderApp(
        { initialized: true, authenticated: false },
        [link]
      );
      const { key } = history.location;
      expect(container.textContent).toContain('login-page');

      rerender(
        <ThemeProvider theme={theme}>
          <HistoryRouter history={history as any}>
            <App auth={{ initialized: true, authenticated: true }} showLogin={false} />
          </HistoryRouter>
        </ThemeProvider>
      );

      expect(container.textContent).toContain('admin-page');
      expect(history.location.pathname + history.location.search).toBe(link);
      expect(history.location.key).toBe(key);
      expect(scrollToSpy).not.toHaveBeenCalled();
    });
  });

  describe('PPR', () => {
    const VISITOR = { initialized: true, authenticated: false };
    const MEMBER = { initialized: true, authenticated: true, data: { uid: 'u1', email: 'pilot@example.com', guest: false, kiosk: false } };
    const GUEST_SESSION = { initialized: true, authenticated: true, data: { uid: 'guest', email: null, guest: true, kiosk: false } };
    const WITHOUT_EMAIL = { initialized: true, authenticated: true, data: { uid: 'tower', email: null, guest: false, kiosk: false } };
    const KIOSK = { initialized: true, authenticated: true, data: { uid: 'kiosk', email: null, guest: false, kiosk: true } };
    const STATUS_LINK = '/ppr/status/-Nabc/abcdefghijklmnopqrstuvwxyzABCDEFGHIJ-_0123';

    const pageAt = (auth: AuthProps, path: string) => {
      const { container, history } = renderApp(auth, [path]);
      return { page: container.textContent, path: history.location.pathname };
    };

    describe('with requests without login', () => {
      beforeEach(() => {
        (global as any).__CONF__ = { profileEnabled: false, ppr: true, pprGuestRequests: true };
      });

      it.each([
        ['/ppr/new', 'ppr-intro-page'],
        ['/ppr/new/', 'ppr-intro-page'],
        ['/PPR/New', 'ppr-intro-page'],
        ['/ppr/guest', 'ppr-guest-request-page'],
        [STATUS_LINK, 'ppr-status-page'],
        ['/ppr/login', 'login-page'],
        ['/ppr', 'login-page'],
        ['/ppr/status/-Nabc', 'login-page'],
        ['/ppr/status/-Nabc/token/more', 'login-page'],
      ])('shows visitors at %s the %s', (path, page) => {
        expect(pageAt(VISITOR, path)).toEqual({ page, path });
      });

      it.each([
        ['/ppr/new', 'ppr-request-page', '/ppr/new'],
        ['/ppr/guest', 'ppr-request-page', '/ppr/new'],
        ['/ppr/login', 'ppr-request-page', '/ppr/new'],
        ['/ppr', 'ppr-status-list', '/ppr'],
        [STATUS_LINK, 'ppr-status-page', STATUS_LINK],
      ])('shows a login with an email address at %s the %s', (path, page, landing) => {
        expect(pageAt(MEMBER, path)).toEqual({ page, path: landing });
      });

      it.each([
        ['a guest session', GUEST_SESSION],
        ['a login without an email address', WITHOUT_EMAIL],
      ])('gives %s the form without login', (_, auth) => {
        expect(pageAt(auth, '/ppr/new')).toEqual({ page: 'ppr-guest-request-page', path: '/ppr/new' });
        expect(pageAt(auth, '/ppr/guest')).toEqual({ page: 'ppr-guest-request-page', path: '/ppr/guest' });
        expect(pageAt(auth, '/ppr/login')).toEqual({ page: 'ppr-guest-request-page', path: '/ppr/new' });
        // there is no list of requests without login
        expect(pageAt(auth, '/ppr')).toEqual({ page: 'ppr-guest-request-page', path: '/ppr/new' });
        expect(pageAt(auth, STATUS_LINK)).toEqual({ page: 'ppr-status-page', path: STATUS_LINK });
      });

      it.each(['/ppr/new', '/ppr/guest', '/ppr/login', '/ppr', STATUS_LINK])('takes the kiosk from %s to the start page', path => {
        expect(pageAt(KIOSK, path)).toEqual({ page: 'start-page', path: '/' });
      });

      it('continues with login: the login, then the form of the login in place of the login\'s entry', () => {
        const { history, container, rerenderWith } = renderApp(VISITOR, ['/ppr/new']);
        expect(container.textContent).toBe('ppr-intro-page');

        act(() => {
          history.push('/ppr/login');
        });
        expect(container.textContent).toBe('login-page');

        rerenderWith(MEMBER);

        expect(container.textContent).toBe('ppr-request-page');
        expect(history.location.pathname).toBe('/ppr/new');
        expect((history as any).index).toBe(1);
      });

      it('goes back from the login to the intro', () => {
        const { history, container } = renderApp(VISITOR, ['/ppr/new']);

        act(() => {
          history.push('/ppr/login');
        });
        act(() => {
          history.back();
        });

        expect(container.textContent).toBe('ppr-intro-page');
      });
    });

    describe('without requests without login', () => {
      beforeEach(() => {
        (global as any).__CONF__ = { profileEnabled: false, ppr: true };
      });

      it.each([
        ['/ppr/new', 'ppr-intro-page'],
        [STATUS_LINK, 'ppr-status-page'],
        ['/ppr/guest', 'login-page'],
      ])('shows visitors at %s the %s', (path, page) => {
        expect(pageAt(VISITOR, path)).toEqual({ page, path });
      });

      it('has no form without login', () => {
        expect(pageAt(MEMBER, '/ppr/guest')).toEqual({ page: 'start-page', path: '/' });
      });

      it.each([
        ['a guest session', GUEST_SESSION],
        ['a login without an email address', WITHOUT_EMAIL],
      ])('gives %s no PPR requests, but the status links', (_, auth) => {
        expect(pageAt(auth, '/ppr/new')).toEqual({ page: 'start-page', path: '/' });
        expect(pageAt(auth, '/ppr')).toEqual({ page: 'start-page', path: '/' });
        expect(pageAt(auth, STATUS_LINK)).toEqual({ page: 'ppr-status-page', path: STATUS_LINK });
      });

      it('keeps the request of a login with an email address', () => {
        expect(pageAt(MEMBER, '/ppr/new')).toEqual({ page: 'ppr-request-page', path: '/ppr/new' });
        expect(pageAt(MEMBER, '/ppr')).toEqual({ page: 'ppr-status-list', path: '/ppr' });
      });
    });

    describe('without PPR', () => {
      beforeEach(() => {
        (global as any).__CONF__ = { profileEnabled: false, ppr: false, pprGuestRequests: true };
      });

      it.each(['/ppr/new', '/ppr/guest', STATUS_LINK])('shows visitors at %s the login', path => {
        expect(pageAt(VISITOR, path)).toEqual({ page: 'login-page', path });
      });

      it.each(['/ppr/new', '/ppr', STATUS_LINK])('takes logins from %s to the start page', path => {
        expect(pageAt(MEMBER, path)).toEqual({ page: 'start-page', path: '/' });
      });
    });
  });

  describe('profileEnabled feature flag', () => {
    it('routes to profile page when flag is enabled', () => {
      (global as any).__CONF__ = { profileEnabled: true };
      const { container } = renderApp(
        { initialized: true, authenticated: true },
        ['/profile']
      );
      expect(container.textContent).toContain('profile-page');
    });

    it('redirects away from /profile when flag is disabled', () => {
      (global as any).__CONF__ = { profileEnabled: false };
      const { container } = renderApp(
        { initialized: true, authenticated: true },
        ['/profile']
      );
      expect(container.textContent).toContain('start-page');
    });
  });
});
