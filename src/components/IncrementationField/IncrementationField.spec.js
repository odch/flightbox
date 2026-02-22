import React from 'react';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IncrementationField from './IncrementationField';

describe('components', () => {
  describe('IncrementationField', () => {
    it('renders the provided value', () => {
      render(<IncrementationField value={42} />);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders minValue when value is undefined', () => {
      render(<IncrementationField minValue={3} />);
      expect(screen.getByText('3')).toBeInTheDocument();
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

    it('does not render increment/decrement buttons in readOnly mode', () => {
      render(<IncrementationField value={10} readOnly />);

      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '-' })).toBeNull();
      expect(screen.queryByRole('button', { name: '+' })).toBeNull();
    });
  });
});
