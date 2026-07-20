import React from 'react';
import {render, fireEvent} from '@testing-library/react';
import {ThemeProvider} from 'styled-components';
import {Provider} from 'react-redux';
import AerodromeQuickPicks from './AerodromeQuickPicks';
import {loadFrequentAerodromes} from '../../modules/frequentAerodromes';

const theme: any = {colors: {main: '#003863', background: '#fafafa', danger: '#e00f00'}};

const makeStore = (state: any) => ({
  getState: () => state,
  subscribe: () => () => undefined,
  dispatch: jest.fn(),
});

const baseState = (overrides: any = {}) => ({
  auth: {data: {email: 'pilot@example.com', guest: false, kiosk: false, admin: false}},
  movements: {data: {array: [
    {location: 'LSGG', createdBy: 'pilot@example.com'},
    {location: 'LSGG', createdBy: 'pilot@example.com'},
    {location: 'LSZR', createdBy: 'pilot@example.com'},
  ]}},
  frequentAerodromes: {data: [], loaded: false},
  ...overrides,
});

const renderWith = (state: any, props: any = {}) => {
  const store = makeStore(state);
  const utils = render(
    <Provider store={store as any}>
      <ThemeProvider theme={theme}>
        <AerodromeQuickPicks value="" onSelect={jest.fn()} {...props}/>
      </ThemeProvider>
    </Provider>
  );
  return {store, ...utils};
};

describe('AerodromeQuickPicks', () => {
  beforeEach(() => {
    (global as any).__CONF__ = {aerodrome: {ICAO: 'LSZO'}, profileEnabled: true};
  });

  afterEach(() => {
    delete (global as any).__CONF__;
  });

  it('renders the home chip plus the pilot\'s frequent aerodromes', () => {
    const {getByTestId} = renderWith(baseState());
    expect(getByTestId('quickpick-home').textContent).toContain('LSZO');
    expect(getByTestId('quickpick-LSGG')).toBeTruthy();
    expect(getByTestId('quickpick-LSZR')).toBeTruthy();
  });

  it('calls onSelect with the ICAO when a chip is clicked', () => {
    const onSelect = jest.fn();
    const {getByTestId} = renderWith(baseState(), {onSelect});
    fireEvent.click(getByTestId('quickpick-LSGG'));
    expect(onSelect).toHaveBeenCalledWith('LSGG');
    fireEvent.click(getByTestId('quickpick-home'));
    expect(onSelect).toHaveBeenCalledWith('LSZO');
  });

  it('shows only the home chip for a guest', () => {
    const {getByTestId, queryByTestId} = renderWith(baseState({
      auth: {data: {email: null, guest: true, kiosk: false}},
    }));
    expect(getByTestId('quickpick-home')).toBeTruthy();
    expect(queryByTestId('quickpick-LSGG')).toBeNull();
  });

  it('renders nothing when readOnly', () => {
    const {container} = renderWith(baseState(), {readOnly: true});
    expect(container.querySelector('.AerodromeQuickPicks')).toBeNull();
  });

  it('does not trigger any fetch for a regular user (zero extra reads)', () => {
    const {store} = renderWith(baseState());
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('fetches once for an admin, whose loaded list is club-wide', () => {
    const {store, getByTestId} = renderWith(baseState({
      auth: {data: {email: 'admin@example.com', admin: true, guest: false, kiosk: false}},
      movements: {data: {array: [{location: 'LFSB', createdBy: 'someone@else.com'}]}},
      frequentAerodromes: {data: ['LSZR'], loaded: false, session: []},
    }));
    expect(store.dispatch).toHaveBeenCalledWith(loadFrequentAerodromes());
    // uses the fetched slice, not the club-wide movement list
    expect(getByTestId('quickpick-LSZR')).toBeTruthy();
  });
});
