import React from 'react';
import { renderWithTheme, fireEvent } from '../../../test/renderWithTheme';
import TimeField from './TimeField';

describe('<TimeField>', () => {
  describe('read-only', () => {
    it('renders formatted value', () => {
      const { container } = renderWithTheme(
        <TimeField value="09:05" readOnly />
      );
      expect(container.textContent).toContain('09:05');
    });

    it('renders 00:00 when value is undefined', () => {
      const { container } = renderWithTheme(<TimeField readOnly />);
      expect(container.textContent).toContain('00:00');
    });

    it('renders 00:00 when value is invalid', () => {
      const { container } = renderWithTheme(
        <TimeField value="not-a-time" readOnly />
      );
      expect(container.textContent).toContain('00:00');
    });
  });

  describe('editable', () => {
    it('renders hours and minutes inputs from value', () => {
      const { container } = renderWithTheme(
        <TimeField value="14:30" dataCy="t" onChange={jest.fn()} />
      );
      const hours = container.querySelector(
        '[data-cy="t-hours-input"]'
      ) as HTMLInputElement;
      const minutes = container.querySelector(
        '[data-cy="t-minutes-input"]'
      ) as HTMLInputElement;
      expect(hours.value).toBe('14');
      expect(minutes.value).toBe('30');
    });

    it('mirrors prop value change into inputs (getDerivedStateFromProps)', () => {
      const { container, rerender } = renderWithTheme(
        <TimeField value="09:15" dataCy="t" onChange={jest.fn()} />
      );
      const hours = () =>
        (container.querySelector('[data-cy="t-hours-input"]') as HTMLInputElement)
          .value;
      const minutes = () =>
        (
          container.querySelector('[data-cy="t-minutes-input"]') as HTMLInputElement
        ).value;
      expect(hours()).toBe('09');
      expect(minutes()).toBe('15');
      rerender(<TimeField value="17:42" dataCy="t" onChange={jest.fn()} />);
      expect(hours()).toBe('17');
      expect(minutes()).toBe('42');
    });

    it('fires onChange with new value on hours blur', () => {
      const onChange = jest.fn();
      const { container } = renderWithTheme(
        <TimeField value="10:20" dataCy="t" onChange={onChange} />
      );
      const hours = container.querySelector(
        '[data-cy="t-hours-input"]'
      ) as HTMLInputElement;
      fireEvent.focus(hours);
      fireEvent.change(hours, { target: { value: '22' } });
      fireEvent.blur(hours);
      expect(onChange).toHaveBeenLastCalledWith({ value: '22:20' });
    });

    it('fires onChange with new value on minutes blur', () => {
      const onChange = jest.fn();
      const { container } = renderWithTheme(
        <TimeField value="10:20" dataCy="t" onChange={onChange} />
      );
      const minutes = container.querySelector(
        '[data-cy="t-minutes-input"]'
      ) as HTMLInputElement;
      fireEvent.focus(minutes);
      fireEvent.change(minutes, { target: { value: '45' } });
      fireEvent.blur(minutes);
      expect(onChange).toHaveBeenLastCalledWith({ value: '10:45' });
    });

    it('fires onChange with null when value normalizes to 00:00', () => {
      const onChange = jest.fn();
      const { container } = renderWithTheme(
        <TimeField value="00:10" dataCy="t" onChange={onChange} />
      );
      const minutes = container.querySelector(
        '[data-cy="t-minutes-input"]'
      ) as HTMLInputElement;
      fireEvent.focus(minutes);
      fireEvent.change(minutes, { target: { value: '00' } });
      fireEvent.blur(minutes);
      expect(onChange).toHaveBeenLastCalledWith({ value: null });
    });

    it('increments minutes on + mousedown and normalizes overflow', () => {
      const onChange = jest.fn();
      const { container } = renderWithTheme(
        <TimeField value="09:59" dataCy="t" onChange={onChange} />
      );
      const incrementBtn = container.querySelector(
        '[data-cy="t-minutes-increment"]'
      ) as HTMLButtonElement;
      fireEvent.mouseDown(incrementBtn);
      fireEvent.mouseUp(incrementBtn);
      expect(onChange).toHaveBeenLastCalledWith({ value: '10:00' });
    });

    it('decrements hours on - mousedown and normalizes negative wrap', () => {
      const onChange = jest.fn();
      const { container } = renderWithTheme(
        <TimeField value="00:30" dataCy="t" onChange={onChange} />
      );
      const decrementBtn = container.querySelector(
        '[data-cy="t-hours-decrement"]'
      ) as HTMLButtonElement;
      fireEvent.mouseDown(decrementBtn);
      fireEvent.mouseUp(decrementBtn);
      expect(onChange).toHaveBeenLastCalledWith({ value: '23:30' });
    });

    it('does not fire onChange on mount', () => {
      const onChange = jest.fn();
      renderWithTheme(
        <TimeField value="10:20" dataCy="t" onChange={onChange} />
      );
      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not throw when onChange is not provided', () => {
      const { container } = renderWithTheme(
        <TimeField value="10:20" dataCy="t" />
      );
      const hours = container.querySelector(
        '[data-cy="t-hours-input"]'
      ) as HTMLInputElement;
      expect(() => {
        fireEvent.focus(hours);
        fireEvent.change(hours, { target: { value: '11' } });
        fireEvent.blur(hours);
      }).not.toThrow();
    });
  });
});
