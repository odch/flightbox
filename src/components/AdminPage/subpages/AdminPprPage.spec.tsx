import React from 'react';
import '../../../i18n';
import {renderWithTheme, screen, act} from '../../../../test/renderWithTheme';

jest.mock('../../../containers/PprSettingsFormContainer', () => ({
  __esModule: true,
  default: () => <div data-testid="ppr-settings-form"/>,
}));

// The lists opened, by the key of their link
const mockOpenedLists: (string | null)[] = [];
jest.mock('../../../containers/PprRequestListContainer', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: jest.fn(({linkedKey}: any) => {
      React.useEffect(() => {
        mockOpenedLists.push(linkedKey);
      }, []);
      return React.createElement('div', {'data-testid': 'ppr-request-list'});
    }),
  };
});

import AdminPprPage from './AdminPprPage';
import PprRequestList from '../../../containers/PprRequestListContainer';

// The router of renderWithTheme reads the URL of jsdom
const visit = (url: string) => window.history.replaceState(null, '', url);

const lastListProps = () => {
  const calls = (PprRequestList as unknown as jest.Mock).mock.calls;
  return calls[calls.length - 1][0];
};

describe('AdminPprPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOpenedLists.length = 0;
  });

  afterEach(() => {
    visit('/');
  });

  it('shows the settings and the list', () => {
    visit('/admin?tab=ppr');
    renderWithTheme(<AdminPprPage/>);

    expect(screen.getByTestId('ppr-settings-form')).toBeInTheDocument();
    expect(screen.getByTestId('ppr-request-list')).toBeInTheDocument();
    expect(lastListProps().linkedKey).toBeNull();
  });

  it('passes the request of a link in the notification email to the list', () => {
    visit('/admin?tab=ppr&request=-Nabc_123');
    renderWithTheme(<AdminPprPage/>);

    expect(lastListProps().linkedKey).toBe('-Nabc_123');
  });

  it('opens a new list for the request of another link', () => {
    visit('/admin?tab=ppr&request=-Nabc_123');
    renderWithTheme(<AdminPprPage/>);

    act(() => {
      window.history.pushState(null, '', '/admin?tab=ppr&request=-Ndef_456');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(lastListProps().linkedKey).toBe('-Ndef_456');
    expect(mockOpenedLists).toEqual(['-Nabc_123', '-Ndef_456']);
  });
});
