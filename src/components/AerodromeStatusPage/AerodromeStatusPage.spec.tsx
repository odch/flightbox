import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

const theme = {
  colors: { main: '#003863', background: '#fafafa', danger: '#e00f00' },
};
const wrap = (el: React.ReactElement) => (
  <ThemeProvider theme={theme}>{el}</ThemeProvider>
);

jest.mock('react-i18next', () => ({
  withTranslation: () => (Component: any) => {
    const Wrapped = (props: any) => (
      <Component {...props} t={(key: string) => key} />
    );
    Wrapped.displayName = `withTranslation(${
      Component.displayName || Component.name
    })`;
    return Wrapped;
  },
  Trans: ({ i18nKey }: { i18nKey: string }) => <>{i18nKey}</>,
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

jest.mock('../Logo', () => ({
  __esModule: true,
  default: () => <div data-testid="logo" />,
}));

jest.mock('../MaterialIcon', () => ({
  __esModule: true,
  default: ({ icon }: any) => <span data-testid="icon" data-icon={icon} />,
}));

jest.mock('../AerodromeStatusForm/StatusOptions', () => ({
  getLabel: (status: string) => `label:${status}`,
}));

import AerodromeStatusPage from './AerodromeStatusPage';

const makeProps = (overrides: any = {}) => ({
  status: undefined,
  watchCurrentAerodromeStatus: jest.fn(),
  ...overrides,
});

describe('<AerodromeStatusPage>', () => {
  it('dispatches watchCurrentAerodromeStatus on mount', () => {
    const watchCurrentAerodromeStatus = jest.fn();
    render(
      wrap(
        <AerodromeStatusPage
          {...makeProps({ watchCurrentAerodromeStatus })}
        />
      )
    );
    expect(watchCurrentAerodromeStatus).toHaveBeenCalledTimes(1);
  });

  it('renders loading indicator when status is undefined', () => {
    const { container, getByTestId } = render(
      wrap(<AerodromeStatusPage {...makeProps()} />)
    );
    expect(getByTestId('icon').getAttribute('data-icon')).toBe('sync');
    expect(container.textContent).toContain('common.loading');
  });

  it('renders unavailable message when status is null', () => {
    const { container } = render(
      wrap(<AerodromeStatusPage {...makeProps({ status: null })} />)
    );
    expect(container.textContent).toContain('aerodromeStatus.unavailable');
  });

  it('renders status details when status is present', () => {
    const { container } = render(
      wrap(
        <AerodromeStatusPage
          {...makeProps({
            status: {
              status: 'open',
              details: 'All good',
              by: 'admin',
              timestamp: 1716393600000,
            },
          })}
        />
      )
    );
    expect(container.textContent).toContain('label:open');
    expect(container.textContent).toContain('All good');
  });
});
