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

jest.mock('./AerodromeStatusDropdown', () => ({
  __esModule: true,
  default: ({ value, onChange }: any) => (
    <select
      data-testid="status-dropdown"
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      <option value="open">open</option>
      <option value="closed">closed</option>
      <option value="restricted">restricted</option>
    </select>
  ),
}));

jest.mock('../TextArea', () => ({
  __esModule: true,
  default: ({ value, onChange, rows }: any) => (
    <textarea
      data-testid="details"
      value={value}
      rows={rows}
      onChange={onChange}
    />
  ),
}));

jest.mock('../Button', () => ({
  __esModule: true,
  default: ({ label, type, disabled }: any) => (
    <button data-testid="save" type={type} disabled={disabled}>
      {label}
    </button>
  ),
}));

import StatusForm from './StatusForm';

const makeProps = (overrides: any = {}) => ({
  data: { status: 'open', details: 'Current details' },
  disabled: false,
  dirty: false,
  updateAerodromeStatus: jest.fn(),
  saveAerodromeStatus: jest.fn(),
  ...overrides,
});

describe('<StatusForm>', () => {
  it('renders form with dropdown, textarea, and save button', () => {
    const { getByTestId } = render(wrap(<StatusForm {...makeProps()} />));
    expect(getByTestId('status-dropdown')).toBeTruthy();
    expect(getByTestId('details')).toBeTruthy();
    expect(getByTestId('save')).toBeTruthy();
  });

  it('passes data.status to dropdown', () => {
    const { getByTestId } = render(
      wrap(
        <StatusForm
          {...makeProps({ data: { status: 'closed', details: '' } })}
        />
      )
    );
    expect((getByTestId('status-dropdown') as HTMLSelectElement).value).toBe(
      'closed'
    );
  });

  it('passes data.details to textarea', () => {
    const { getByTestId } = render(
      wrap(
        <StatusForm
          {...makeProps({ data: { status: 'open', details: 'hello' } })}
        />
      )
    );
    expect((getByTestId('details') as HTMLTextAreaElement).value).toBe('hello');
  });

  it('calls updateAerodromeStatus on status change (with current details)', () => {
    const updateAerodromeStatus = jest.fn();
    const { getByTestId } = render(
      wrap(
        <StatusForm
          {...makeProps({
            updateAerodromeStatus,
            data: { status: 'open', details: 'keep' },
          })}
        />
      )
    );
    fireEvent.change(getByTestId('status-dropdown'), {
      target: { value: 'restricted' },
    });
    expect(updateAerodromeStatus).toHaveBeenCalledWith('restricted', 'keep');
  });

  it('calls updateAerodromeStatus on details change (with current status)', () => {
    const updateAerodromeStatus = jest.fn();
    const { getByTestId } = render(
      wrap(
        <StatusForm
          {...makeProps({
            updateAerodromeStatus,
            data: { status: 'closed', details: '' },
          })}
        />
      )
    );
    fireEvent.change(getByTestId('details'), {
      target: { value: 'new text' },
    });
    expect(updateAerodromeStatus).toHaveBeenCalledWith('closed', 'new text');
  });

  it('submitting the form calls saveAerodromeStatus with current data', () => {
    const saveAerodromeStatus = jest.fn();
    const data = { status: 'restricted', details: 'x' };
    const { container } = render(
      wrap(
        <StatusForm {...makeProps({ saveAerodromeStatus, data, dirty: true })} />
      )
    );
    fireEvent.submit(container.querySelector('form')!);
    expect(saveAerodromeStatus).toHaveBeenCalledWith(data);
  });

  it('disables save button when not dirty', () => {
    const { getByTestId } = render(
      wrap(<StatusForm {...makeProps({ dirty: false })} />)
    );
    expect((getByTestId('save') as HTMLButtonElement).disabled).toBe(true);
  });

  it('enables save button when dirty and not disabled', () => {
    const { getByTestId } = render(
      wrap(<StatusForm {...makeProps({ dirty: true })} />)
    );
    expect((getByTestId('save') as HTMLButtonElement).disabled).toBe(false);
  });

  it('disables save button when disabled is true (even if dirty)', () => {
    const { getByTestId } = render(
      wrap(<StatusForm {...makeProps({ dirty: true, disabled: true })} />)
    );
    expect((getByTestId('save') as HTMLButtonElement).disabled).toBe(true);
  });
});
