import React from 'react';
import { renderWithTheme, fireEvent } from '../../../test/renderWithTheme';
import NumberBlock from './NumberBlock';

describe('<NumberBlock>', () => {
  it('displays value formatted with leading zero', () => {
    const { container } = renderWithTheme(
      <NumberBlock value={5} dataCy="n" onChange={jest.fn()} />
    );
    const input = container.querySelector(
      '[data-cy="n-input"]'
    ) as HTMLInputElement;
    expect(input.value).toBe('05');
  });

  it('shows typed value while editing (does not commit yet)', () => {
    const onChange = jest.fn();
    const { container } = renderWithTheme(
      <NumberBlock value={10} dataCy="n" onChange={onChange} />
    );
    const input = container.querySelector(
      '[data-cy="n-input"]'
    ) as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '2' } });
    expect(input.value).toBe('2');
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: '25' } });
    expect(input.value).toBe('25');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('rejects input with more than two digits', () => {
    const { container } = renderWithTheme(
      <NumberBlock value={10} dataCy="n" onChange={jest.fn()} />
    );
    const input = container.querySelector(
      '[data-cy="n-input"]'
    ) as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '22' } });
    expect(input.value).toBe('22');
    fireEvent.change(input, { target: { value: '222' } });
    expect(input.value).toBe('22');
  });

  it('rejects non-digit input', () => {
    const { container } = renderWithTheme(
      <NumberBlock value={10} dataCy="n" onChange={jest.fn()} />
    );
    const input = container.querySelector(
      '[data-cy="n-input"]'
    ) as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '1' } });
    expect(input.value).toBe('1');
    fireEvent.change(input, { target: { value: '1a' } });
    expect(input.value).toBe('1');
  });

  it('commits parsed value on blur', () => {
    const onChange = jest.fn();
    const { container } = renderWithTheme(
      <NumberBlock value={10} dataCy="n" onChange={onChange} />
    );
    const input = container.querySelector(
      '[data-cy="n-input"]'
    ) as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '42' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(42);
  });

  it('commits 0 when edit value is empty on blur', () => {
    const onChange = jest.fn();
    const { container } = renderWithTheme(
      <NumberBlock value={10} dataCy="n" onChange={onChange} />
    );
    const input = container.querySelector(
      '[data-cy="n-input"]'
    ) as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('reverts to prop value after blur (clears editing state)', () => {
    const onChange = jest.fn();
    const { container, rerender } = renderWithTheme(
      <NumberBlock value={10} dataCy="n" onChange={onChange} />
    );
    const input = () =>
      container.querySelector('[data-cy="n-input"]') as HTMLInputElement;
    fireEvent.focus(input());
    fireEvent.change(input(), { target: { value: '42' } });
    fireEvent.blur(input());
    rerender(<NumberBlock value={42} dataCy="n" onChange={onChange} />);
    expect(input().value).toBe('42');
  });

  it('increments by 1 on + mouseDown', () => {
    const onChange = jest.fn();
    const { container } = renderWithTheme(
      <NumberBlock value={7} dataCy="n" onChange={onChange} />
    );
    const btn = container.querySelector(
      '[data-cy="n-increment"]'
    ) as HTMLButtonElement;
    fireEvent.mouseDown(btn);
    fireEvent.mouseUp(btn);
    expect(onChange).toHaveBeenCalledWith(8);
  });

  it('decrements by 1 on - mouseDown', () => {
    const onChange = jest.fn();
    const { container } = renderWithTheme(
      <NumberBlock value={7} dataCy="n" onChange={onChange} />
    );
    const btn = container.querySelector(
      '[data-cy="n-decrement"]'
    ) as HTMLButtonElement;
    fireEvent.mouseDown(btn);
    fireEvent.mouseUp(btn);
    expect(onChange).toHaveBeenCalledWith(6);
  });
});
