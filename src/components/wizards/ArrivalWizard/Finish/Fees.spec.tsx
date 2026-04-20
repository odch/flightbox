import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

const theme: any = {
  colors: { main: '#003863', background: '#fafafa', danger: '#e00f00' },
};
const wrap = (el: React.ReactElement) => (
  <ThemeProvider theme={theme}>{el}</ThemeProvider>
);

jest.mock('react-i18next', () => ({
  withTranslation: () => (Component: any) => {
    const Wrapped = (props: any) => (
      <Component {...props} t={(key: string, opts?: any) =>
        opts ? `${key}:${JSON.stringify(opts)}` : key
      } />
    );
    Wrapped.displayName = `withTranslation(${
      Component.displayName || Component.name
    })`;
    return Wrapped;
  },
  Trans: ({ i18nKey }: { i18nKey: string }) => <>{i18nKey}</>,
  useTranslation: () => ({
    t: (key: string, opts?: any) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

jest.mock('../../../MaterialIcon', () => ({
  __esModule: true,
  default: ({ icon }: any) => <span data-testid="icon" data-icon={icon} />,
}));

import Fees from './Fees';

const makeFees = (overrides: any = {}) => ({
  landings: 1,
  landingFeeSingle: 1000,
  landingFeeTotal: 1000,
  goArounds: 0,
  goAroundFeeSingle: 500,
  goAroundFeeTotal: 0,
  totalNet: 1000,
  vat: 0,
  roundingDifference: 0,
  totalGross: 1000,
  ...overrides,
});

describe('<Fees>', () => {
  it('renders the gross total label', () => {
    const { container } = render(wrap(<Fees fees={makeFees()} />));
    expect(container.textContent).toContain('arrival.fees.landingFee');
  });

  it('does not show details table by default', () => {
    const { container } = render(wrap(<Fees fees={makeFees()} />));
    expect(container.textContent).not.toContain('arrival.fees.total');
    expect(container.textContent).toContain('arrival.fees.showDetails');
  });

  it('uses expand_more icon when collapsed', () => {
    const { getByTestId } = render(wrap(<Fees fees={makeFees()} />));
    expect(getByTestId('icon').getAttribute('data-icon')).toBe('expand_more');
  });

  it('expands details on click and switches icon + label', () => {
    const { container, getByTestId } = render(
      wrap(<Fees fees={makeFees()} />)
    );
    fireEvent.click(container.querySelector('button')!);
    expect(container.textContent).toContain('arrival.fees.total');
    expect(container.textContent).toContain('arrival.fees.hideDetails');
    expect(getByTestId('icon').getAttribute('data-icon')).toBe('expand_less');
  });

  it('collapses again on second click', () => {
    const { container } = render(wrap(<Fees fees={makeFees()} />));
    const button = container.querySelector('button')!;
    fireEvent.click(button);
    fireEvent.click(button);
    expect(container.textContent).not.toContain('arrival.fees.total');
  });

  it('shows VAT row when vat > 0 (expanded)', () => {
    const { container } = render(
      wrap(
        <Fees
          fees={makeFees({ vat: 81, totalGross: 1081, totalNet: 1000 })}
        />
      )
    );
    fireEvent.click(container.querySelector('button')!);
    expect(container.textContent).toContain('arrival.fees.vat');
  });

  it('omits VAT row when vat is zero (expanded)', () => {
    const { container } = render(wrap(<Fees fees={makeFees()} />));
    fireEvent.click(container.querySelector('button')!);
    expect(container.textContent).not.toContain('arrival.fees.vat');
  });

  it('shows go-around row when goAroundFeeTotal > 0 (expanded)', () => {
    const { container } = render(
      wrap(
        <Fees
          fees={makeFees({ goArounds: 2, goAroundFeeTotal: 1000 })}
        />
      )
    );
    fireEvent.click(container.querySelector('button')!);
    expect(container.textContent).toContain('arrival.fees.goAround');
  });

  it('shows rounding row when roundingDifference is non-zero (expanded)', () => {
    const { container } = render(
      wrap(
        <Fees
          fees={makeFees({ roundingDifference: -5, totalGross: 995 })}
        />
      )
    );
    fireEvent.click(container.querySelector('button')!);
    expect(container.textContent).toContain('arrival.fees.rounding');
  });
});
