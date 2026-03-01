import React from 'react';
import { renderWithTheme, screen, fireEvent } from '../../../test/renderWithTheme';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
  withTranslation: () => Component => {
    const WrappedComponent = props => <Component {...props} t={key => key} />;
    WrappedComponent.displayName = `withTranslation(${Component.displayName || Component.name})`;
    return WrappedComponent;
  },
  Trans: ({ i18nKey }) => i18nKey,
}));

jest.mock('../MaterialIcon', () => {
  const React = require('react');
  return function MockMaterialIcon({ icon }) {
    return <span data-testid="material-icon" data-icon={icon} />;
  };
});

import LoginInfo from './LoginInfo';

const authenticatedAuth = {
  authenticated: true,
  data: {
    uid: 'user-123',
    email: 'test@example.com',
    links: true,
  },
};

const unauthenticatedAuth = {
  authenticated: false,
  data: {},
};

const baseProps = {
  auth: authenticatedAuth,
  logout: jest.fn(),
  showLogin: jest.fn(),
};

describe('LoginInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when unauthenticated', () => {
    it('renders login button', () => {
      renderWithTheme(
        <LoginInfo {...baseProps} auth={unauthenticatedAuth} />
      );
      expect(screen.getByText('common.login')).toBeInTheDocument();
    });

    it('calls showLogin when login button is clicked', () => {
      const showLogin = jest.fn();
      renderWithTheme(
        <LoginInfo
          {...baseProps}
          auth={unauthenticatedAuth}
          showLogin={showLogin}
        />
      );
      fireEvent.click(screen.getByText('common.login'));
      expect(showLogin).toHaveBeenCalled();
    });

    it('does not render account icon when unauthenticated', () => {
      renderWithTheme(
        <LoginInfo {...baseProps} auth={unauthenticatedAuth} />
      );
      const icons = screen.queryAllByTestId('material-icon');
      expect(icons.length).toBe(0);
    });
  });

  describe('when authenticated', () => {
    it('renders without crashing', () => {
      const { container } = renderWithTheme(<LoginInfo {...baseProps} />);
      expect(container.firstChild).toBeTruthy();
    });

    it('renders account icon', () => {
      renderWithTheme(<LoginInfo {...baseProps} />);
      const icon = screen.getByTestId('material-icon');
      expect(icon.getAttribute('data-icon')).toBe('account_box');
    });

    it('renders the email as username', () => {
      renderWithTheme(<LoginInfo {...baseProps} />);
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('does not show menu by default', () => {
      renderWithTheme(<LoginInfo {...baseProps} />);
      expect(screen.queryByText('login.logout')).not.toBeInTheDocument();
    });

    it('opens menu when username is clicked', () => {
      renderWithTheme(<LoginInfo {...baseProps} />);
      fireEvent.click(screen.getByText('test@example.com'));
      expect(screen.getByText('login.logout')).toBeInTheDocument();
    });

    it('shows profile link when menu is open for regular user', () => {
      renderWithTheme(<LoginInfo {...baseProps} />);
      fireEvent.click(screen.getByText('test@example.com'));
      expect(screen.getByText('login.profile')).toBeInTheDocument();
    });

    it('calls logout when logout button is clicked', () => {
      const logout = jest.fn();
      renderWithTheme(<LoginInfo {...baseProps} logout={logout} />);
      fireEvent.click(screen.getByText('test@example.com'));
      fireEvent.click(screen.getByText('login.logout'));
      expect(logout).toHaveBeenCalled();
    });

    it('toggles menu closed when username is clicked again', () => {
      renderWithTheme(<LoginInfo {...baseProps} />);
      // First click: opens menu
      const usernameEls = screen.getAllByText('test@example.com');
      fireEvent.click(usernameEls[0]);
      expect(screen.getByText('login.logout')).toBeInTheDocument();
      // Second click: close menu (click on StyledUserNameWrapper - the first occurrence)
      fireEvent.click(screen.getAllByText('test@example.com')[0]);
      expect(screen.queryByText('login.logout')).not.toBeInTheDocument();
    });

    it('does not show menu when links is false', () => {
      renderWithTheme(
        <LoginInfo
          {...baseProps}
          auth={{
            authenticated: true,
            data: { uid: 'u1', email: 'u@e.com', links: false },
          }}
        />
      );
      fireEvent.click(screen.getByText('u@e.com'));
      expect(screen.queryByText('login.logout')).not.toBeInTheDocument();
    });
  });

  describe('username display', () => {
    it('shows guest label when auth.data.guest is true', () => {
      renderWithTheme(
        <LoginInfo
          {...baseProps}
          auth={{
            authenticated: true,
            data: { uid: 'guest-uid', guest: true, links: true },
          }}
        />
      );
      expect(screen.getByText('login.guest')).toBeInTheDocument();
    });

    it('shows kiosk label when auth.data.kiosk is true', () => {
      renderWithTheme(
        <LoginInfo
          {...baseProps}
          auth={{
            authenticated: true,
            data: { uid: 'kiosk-uid', kiosk: true, links: true },
          }}
        />
      );
      expect(screen.getByText('login.kiosk')).toBeInTheDocument();
    });

    it('shows uid when no email and not guest or kiosk', () => {
      renderWithTheme(
        <LoginInfo
          {...baseProps}
          auth={{
            authenticated: true,
            data: { uid: 'some-uid', links: true },
          }}
        />
      );
      expect(screen.getByText('some-uid')).toBeInTheDocument();
    });

    it('does not show profile link for guest users', () => {
      renderWithTheme(
        <LoginInfo
          {...baseProps}
          auth={{
            authenticated: true,
            data: { uid: 'guest-uid', guest: true, links: true },
          }}
        />
      );
      // Click to open menu
      fireEvent.click(screen.getAllByText('login.guest')[0]);
      expect(screen.queryByText('login.profile')).not.toBeInTheDocument();
    });

    it('does not show profile link for kiosk users', () => {
      renderWithTheme(
        <LoginInfo
          {...baseProps}
          auth={{
            authenticated: true,
            data: { uid: 'kiosk-uid', kiosk: true, links: true },
          }}
        />
      );
      fireEvent.click(screen.getAllByText('login.kiosk')[0]);
      expect(screen.queryByText('login.profile')).not.toBeInTheDocument();
    });

    it('does not show profile link for ipauth user', () => {
      renderWithTheme(
        <LoginInfo
          {...baseProps}
          auth={{
            authenticated: true,
            data: { uid: 'ipauth', email: 'ip@a.ch', links: true },
          }}
        />
      );
      fireEvent.click(screen.getAllByText('ip@a.ch')[0]);
      expect(screen.queryByText('login.profile')).not.toBeInTheDocument();
    });
  });

  describe('click outside', () => {
    it('closes menu when clicking outside', () => {
      renderWithTheme(<LoginInfo {...baseProps} />);
      // Click opens the menu (UserName span is visible before menu opens)
      fireEvent.click(screen.getAllByText('test@example.com')[0]);
      expect(screen.getByText('login.logout')).toBeInTheDocument();

      // Simulate click outside by triggering a document click event
      fireEvent.click(document.body);
      expect(screen.queryByText('login.logout')).not.toBeInTheDocument();
    });
  });
});
