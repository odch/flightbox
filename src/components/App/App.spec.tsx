import React from 'react';
import { act, render } from '@testing-library/react';
import { Route, Router } from 'react-router-dom';
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

import App from './App';

const theme = {
  colors: { main: '#003863', background: '#fafafa', danger: '#e00f00' },
};

type AuthProps = { initialized: boolean; authenticated?: boolean };

const renderApp = (auth: AuthProps, initialEntries: string[] = ['/']) => {
  const history = createMemoryHistory({ initialEntries });
  const utils = render(
    <ThemeProvider theme={theme}>
      <Router history={history}>
        <Route
          render={(routeProps: any) => (
            <App {...routeProps} auth={auth} showLogin={false} />
          )}
        />
      </Router>
    </ThemeProvider>
  );
  return { history, ...utils };
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
        history.goBack();
      });
      expect(scrollToSpy).not.toHaveBeenCalled();
    });

    it('does not scroll on initial render', () => {
      renderApp({ initialized: true, authenticated: true });
      expect(scrollToSpy).not.toHaveBeenCalled();
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
