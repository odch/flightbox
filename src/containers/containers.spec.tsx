import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { ThemeProvider } from 'styled-components';

(global as any).__CONF__ = {
  enabledFlightTypes: ['private', 'instruction'],
  paymentMethods: {},
  memberManagement: false,
  aerodrome: {
    name: 'Test',
    ICAO: 'LSZT',
    runways: [{ name: '06' }, { name: '24' }],
  },
};

const theme: any = {
  colors: { main: '#003863', background: '#fafafa', danger: '#e00f00' },
};

interface MockStore {
  getState: () => any;
  dispatch: (a: any) => any;
  subscribe: () => () => void;
  actions: any[];
}

const makeStore = (state: any): MockStore => {
  const actions: any[] = [];
  return {
    getState: () => state,
    dispatch: (a: any) => {
      actions.push(a);
      return a;
    },
    subscribe: () => () => {},
    actions,
  };
};

const wrap = (store: MockStore, el: React.ReactElement) => (
  <Provider store={store as any}>
    <ThemeProvider theme={theme}>{el}</ThemeProvider>
  </Provider>
);

// Mock the reports module to skip sagas (which pull in pdfmake → TextEncoder).
jest.mock('../modules/reports', () => {
  const actions = jest.requireActual('../modules/reports/actions');
  return {
    ...actions,
    sagas: [],
    default: () => ({}),
  };
});

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

// Mock inner presentational components to avoid pulling in their deps.
jest.mock('../components/InvoiceRecipientsList', () => ({
  __esModule: true,
  default: () => <div data-testid="invoice-recipients-list" />,
}));

jest.mock('../components/UserDropdown', () => ({
  __esModule: true,
  default: () => <div data-testid="user-dropdown" />,
}));

jest.mock('../components/AircraftDropdown', () => ({
  __esModule: true,
  default: () => <div data-testid="aircraft-dropdown" />,
}));

jest.mock('../components/ItemList', () => ({
  __esModule: true,
  default: () => <div data-testid="item-list" />,
}));

jest.mock('../components/UserImportForm', () => ({
  __esModule: true,
  default: () => <div data-testid="user-import-form" />,
}));

jest.mock('../components/YearlySummaryReportForm', () => ({
  __esModule: true,
  default: () => <div data-testid="yearly-summary-report-form" />,
}));

jest.mock('../components/ReportForm', () => ({
  __esModule: true,
  default: () => <div data-testid="report-form" />,
}));

jest.mock('../components/AirstatReportForm', () => ({
  __esModule: true,
  default: () => <div data-testid="airstat-report-form" />,
}));

jest.mock('../components/wizards/ArrivalWizard/Finish', () => ({
  __esModule: true,
  default: () => <div data-testid="arrival-finish" />,
  FinishLoading: () => <div data-testid="arrival-finish-loading" />,
}));

jest.mock('../components/wizards/MovementWizard', () => ({
  HeadingType: { ARRIVAL: 'arrival', DEPARTURE: 'departure' },
}));

describe('container mount dispatches', () => {
  let InvoiceRecipientsListContainer: any;
  let UserDropdownContainer: any;
  let AircraftDropdownContainer: any;
  let AircraftsItemListContainer: any;
  let ArrivalFinishContainer: any;
  let UserImportFormContainer: any;
  let YearlySummaryReportFormContainer: any;
  let LandingsReportFormContainer: any;
  let AirstatReportFormContainer: any;
  let InvoicesReportFormContainer: any;
  let AerodromeStatusBannerContainer: any;
  let AerodromeStatusBannerToggleContainer: any;

  beforeAll(() => {
    InvoiceRecipientsListContainer =
      require('./InvoiceRecipientsListContainer').default;
    UserDropdownContainer = require('./UserDropdownContainer').default;
    AircraftDropdownContainer = require('./AircraftDropdownContainer').default;
    AircraftsItemListContainer =
      require('./AircraftsItemListContainer').default;
    ArrivalFinishContainer = require('./ArrivalFinishContainer').default;
    UserImportFormContainer = require('./UserImportFormContainer').default;
    YearlySummaryReportFormContainer = require(
      './YearlySummaryReportFormContainer'
    ).default;
    LandingsReportFormContainer = require(
      './LandingsReportFormContainer'
    ).default;
    AirstatReportFormContainer = require('./AirstatReportFormContainer').default;
    InvoicesReportFormContainer = require(
      './InvoicesReportFormContainer'
    ).default;
    AerodromeStatusBannerContainer = require(
      './AerodromeStatusBannerContainer'
    ).default;
    AerodromeStatusBannerToggleContainer = require(
      './AerodromeStatusBannerToggleContainer'
    ).default;
  });

  const countOf = (store: MockStore, type: string) =>
    store.actions.filter(a => a.type === type).length;

  it('InvoiceRecipientsListContainer dispatches LOAD_INVOICE_RECIPIENT_SETTINGS exactly once on mount', () => {
    const store = makeStore({
      settings: { invoiceRecipients: { recipients: [] } },
    });
    render(wrap(store, <InvoiceRecipientsListContainer />));
    expect(countOf(store, 'LOAD_INVOICE_RECIPIENT_SETTINGS')).toBe(1);
  });

  it('UserDropdownContainer dispatches LOAD_USERS exactly once on mount', () => {
    const store = makeStore({ users: { data: {} } });
    render(
      wrap(
        store,
        <UserDropdownContainer
          onChange={jest.fn()}
          onFocus={jest.fn()}
          onBlur={jest.fn()}
        />
      )
    );
    expect(countOf(store, 'LOAD_USERS')).toBe(1);
  });

  it('AircraftDropdownContainer dispatches LOAD_AIRCRAFTS exactly once on mount', () => {
    const store = makeStore({ aircrafts: { data: {} } });
    render(
      wrap(
        store,
        <AircraftDropdownContainer
          onChange={jest.fn()}
          onFocus={jest.fn()}
          onBlur={jest.fn()}
        />
      )
    );
    expect(countOf(store, 'LOAD_AIRCRAFTS')).toBe(1);
  });

  it('AircraftsItemListContainer dispatches LOAD_AIRCRAFT_SETTINGS exactly once on mount', () => {
    const store = makeStore({
      settings: { aircrafts: { club: {}, homeBase: {} } },
      ui: { settings: { aircrafts: { newItem: {} } } },
    });
    render(wrap(store, <AircraftsItemListContainer type="club" />));
    expect(countOf(store, 'LOAD_AIRCRAFT_SETTINGS')).toBe(1);
  });

  it('ArrivalFinishContainer dispatches LOAD_AIRCRAFT_SETTINGS and LOAD_USER_INVOICE_RECIPIENTS exactly once on mount', () => {
    const store = makeStore({
      settings: { aircrafts: {} },
      invoiceRecipients: { recipients: undefined },
      movements: {},
      auth: { data: {} },
      ui: { wizard: { values: {} } },
    });
    render(
      wrap(
        store,
        <ArrivalFinishContainer
          itemKey="mov-1"
          immatriculation="HB-XYZ"
          email="test@example.ch"
          fees={{ landings: 1, goArounds: 0 }}
          headingType="arrival"
          finish={jest.fn()}
        />
      )
    );
    expect(countOf(store, 'LOAD_AIRCRAFT_SETTINGS')).toBe(1);
    expect(countOf(store, 'LOAD_USER_INVOICE_RECIPIENTS')).toBe(1);
  });

  it('UserImportFormContainer dispatches INIT_IMPORT exactly once with name=users', () => {
    const store = makeStore({ imports: {} });
    render(wrap(store, <UserImportFormContainer />));
    const inits = store.actions.filter(a => a.type === 'INIT_IMPORT');
    expect(inits.length).toBe(1);
    expect(inits[0].payload.name).toBe('users');
  });

  it('YearlySummaryReportFormContainer dispatches INIT_REPORT exactly once with name=yearlySummary', () => {
    const store = makeStore({ reports: {} });
    render(wrap(store, <YearlySummaryReportFormContainer />));
    const inits = store.actions.filter(a => a.type === 'INIT_REPORT');
    expect(inits.length).toBe(1);
    expect(inits[0].payload.name).toBe('yearlySummary');
  });

  it('LandingsReportFormContainer dispatches INIT_REPORT exactly once with name=landings', () => {
    const store = makeStore({ reports: {} });
    render(wrap(store, <LandingsReportFormContainer />));
    const inits = store.actions.filter(a => a.type === 'INIT_REPORT');
    expect(inits.length).toBe(1);
    expect(inits[0].payload.name).toBe('landings');
  });

  it('AirstatReportFormContainer dispatches INIT_REPORT exactly once with name=airstat', () => {
    const store = makeStore({ reports: {} });
    render(wrap(store, <AirstatReportFormContainer />));
    const inits = store.actions.filter(a => a.type === 'INIT_REPORT');
    expect(inits.length).toBe(1);
    expect(inits[0].payload.name).toBe('airstat');
  });

  it('InvoicesReportFormContainer dispatches INIT_REPORT exactly once with name=invoices', () => {
    const store = makeStore({ reports: {} });
    render(wrap(store, <InvoicesReportFormContainer />));
    const inits = store.actions.filter(a => a.type === 'INIT_REPORT');
    expect(inits.length).toBe(1);
    expect(inits[0].payload.name).toBe('invoices');
  });

  it('AerodromeStatusBannerContainer dispatches WATCH_CURRENT_AERODROME_STATUS exactly once on mount', () => {
    const store = makeStore({
      settings: {
        aerodromeStatus: { current: undefined },
        aerodromeStatusBannerEnabled: { enabled: false },
      },
    });
    render(wrap(store, <AerodromeStatusBannerContainer />));
    expect(countOf(store, 'WATCH_CURRENT_AERODROME_STATUS')).toBe(1);
  });

  it('AerodromeStatusBannerToggleContainer reflects the enabled flag from the store', () => {
    const store = makeStore({
      settings: {
        aerodromeStatusBannerEnabled: { enabled: true, saving: false },
      },
    });
    const { container } = render(
      wrap(store, <AerodromeStatusBannerToggleContainer />)
    );
    expect(
      (container.querySelector('input[type="checkbox"]') as HTMLInputElement)
        .checked
    ).toBe(true);
  });

  it('does not re-dispatch init actions when the container re-renders with same props', () => {
    const store = makeStore({ reports: {} });
    const { rerender } = render(
      wrap(store, <LandingsReportFormContainer />)
    );
    const initialInitCount = countOf(store, 'INIT_REPORT');
    expect(initialInitCount).toBe(1);
    rerender(wrap(store, <LandingsReportFormContainer />));
    expect(countOf(store, 'INIT_REPORT')).toBe(initialInitCount);
  });
});
