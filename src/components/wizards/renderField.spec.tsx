import React from 'react';
import {renderWithTheme, screen} from '../../../test/renderWithTheme';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({t: key => key}),
  withTranslation: () => Component => {
    const WrappedComponent = props => <Component {...props} t={key => key}/>;
    WrappedComponent.displayName = `withTranslation(${Component.displayName || Component.name})`;
    return WrappedComponent;
  },
}));

import {renderPhoneField} from './renderField';

const baseProps = (value: string, masked: boolean) => ({
  input: {
    name: 'phone',
    value,
    onChange: jest.fn(),
    onBlur: jest.fn(),
    onFocus: jest.fn(),
  },
  meta: {touched: false, error: null, active: false},
  name: 'phone',
  label: 'Phone',
  masked,
});

describe('renderPhoneField', () => {
  it('uses phone masking when masked', () => {
    const phone = '+41791234567';
    renderWithTheme(renderPhoneField(baseProps(phone, true)));

    // maskPhone: all but last 2 chars replaced with *
    const expected = '*'.repeat(phone.length - 2) + '67';
    expect(screen.getByText(expected)).toBeDefined();
  });

  it('renders PhoneInput with type tel when not masked', () => {
    renderWithTheme(renderPhoneField(baseProps('+41791234567', false)));

    const input = screen.getByDisplayValue('+41791234567');
    expect(input).toHaveAttribute('type', 'tel');
  });
});
