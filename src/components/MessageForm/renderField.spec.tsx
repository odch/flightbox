import React from 'react';
import {renderWithTheme, screen} from '../../../test/renderWithTheme';

import {renderPhoneField} from './renderField';

const baseProps = (value: string) => ({
  input: {
    name: 'phone',
    value,
    onChange: jest.fn(),
    onBlur: jest.fn(),
    onFocus: jest.fn(),
  },
  meta: {touched: false, error: null},
  name: 'phone',
  label: 'Phone',
});

describe('MessageForm renderPhoneField', () => {
  it('renders with type tel', () => {
    renderWithTheme(renderPhoneField(baseProps('+41791234567')));
    const input = screen.getByDisplayValue('+41791234567');
    expect(input).toHaveAttribute('type', 'tel');
  });

  it('renders empty input when no value', () => {
    renderWithTheme(renderPhoneField(baseProps('')));
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('');
    expect(input).toHaveAttribute('type', 'tel');
  });
});
