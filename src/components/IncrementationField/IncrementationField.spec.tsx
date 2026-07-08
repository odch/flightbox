import React from 'react';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IncrementationField from './IncrementationField';

describe('components', () => {
  describe('IncrementationField', () => {
    it('renders the provided value', () => {
      render(<IncrementationField value={42} />);
      expect(screen.getByRole('textbox')).toHaveValue('42');
    });

    it('renders minValue when value is undefined', () => {
      render(<IncrementationField minValue={3} />);
      expect(screen.getByRole('textbox')).toHaveValue('3');
    });

    it('calls onChange with incremented value on increment click', async () => {
      const user = userEvent.setup();
      const handler = jest.fn();

      render(<IncrementationField value={42} onChange={handler} />);

      await user.click(screen.getByRole('button', { name: '+' }));

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ target: { value: 43 } });
    });

    it('calls onChange with decremented value on decrement click', async () => {
      const user = userEvent.setup();
      const handler = jest.fn();

      render(<IncrementationField value={42} onChange={handler} />);

      await user.click(screen.getByRole('button', { name: '-' }));

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ target: { value: 41 } });
    });

    it('clamps value to minValue when decrementing below minValue', async () => {
      const user = userEvent.setup();
      const handler = jest.fn();

      render(<IncrementationField value={3} minValue={3} onChange={handler} />);

      await user.click(screen.getByRole('button', { name: '-' }));

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ target: { value: 3 } });
    });

    it('commits a typed value on blur', async () => {
      const user = userEvent.setup();
      const handler = jest.fn();

      render(<IncrementationField value={0} onChange={handler} />);

      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.type(input, '17');
      await user.tab();

      expect(handler).toHaveBeenCalledWith({ target: { value: 17 } });
    });

    it('ignores non-digit input', async () => {
      const user = userEvent.setup();
      const handler = jest.fn();

      render(<IncrementationField value={5} onChange={handler} />);

      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.type(input, 'ab-.e');

      expect(input).toHaveValue('5');
    });

    it('commits minValue when cleared and blurred', async () => {
      const user = userEvent.setup();
      const handler = jest.fn();

      render(<IncrementationField value={5} minValue={2} onChange={handler} />);

      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.tab();

      expect(handler).toHaveBeenCalledWith({ target: { value: 2 } });
    });

    it('clamps a typed value below minValue on blur', async () => {
      const user = userEvent.setup();
      const handler = jest.fn();

      render(<IncrementationField value={5} minValue={3} onChange={handler} />);

      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.type(input, '1');
      await user.tab();

      expect(handler).toHaveBeenCalledWith({ target: { value: 3 } });
    });

    it('does not render increment/decrement buttons in readOnly mode', () => {
      render(<IncrementationField value={10} readOnly />);

      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '-' })).toBeNull();
      expect(screen.queryByRole('button', { name: '+' })).toBeNull();
    });
  });
});
