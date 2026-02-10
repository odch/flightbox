import React from 'react';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IncrementationField from './IncrementationField';

describe('components', () => {
  describe('IncrementationField', () => {
    it('is initialized with value', () => {
      const { container } = render(<IncrementationField value={42}/>);
      expect(container).toMatchSnapshot();
    });

    it('is initialized with value if value and min value is specified', () => {
      const { container } = render(<IncrementationField value={42} minValue={3}/>);
      expect(container).toMatchSnapshot();
    });

    it('throws error if specified value is lower than min value', () => {
      expect(() => render(<IncrementationField value={2} minValue={3}/>))
        .toThrow('Given value 2 is lower than min value 3');
    });

    it('is initialized with 0 if no value and min value is specified', () => {
      const { container } = render(<IncrementationField/>);
      expect(container).toMatchSnapshot();
    });

    it('is initialized with min value if no value is specified', () => {
      const { container } = render(<IncrementationField minValue={3}/>);
      expect(container).toMatchSnapshot();
    });

    it('is incremented by 1 on increment button click', async () => {
      const user = userEvent.setup();
      const { container } = render(<IncrementationField/>);

      expect(container).toMatchSnapshot();

      await user.click(screen.getByRole('button', { name: /increment|plus|\+/i }));

      expect(container).toMatchSnapshot();
    });

    it('is decremented by 1 on decrement button click', async () => {
      const user = userEvent.setup();
      const { container } = render(<IncrementationField value={42}/>);

      expect(container).toMatchSnapshot();

      await user.click(screen.getByRole('button', { name: /decrement|minus|-/i }));

      expect(container).toMatchSnapshot();
    });

    it('cannot have value lower than min value', async () => {
      const user = userEvent.setup();
      const { container } = render(<IncrementationField minValue={3}/>);

      expect(container).toMatchSnapshot();

      await user.click(screen.getByRole('button', { name: /decrement|minus|-/i }));

      expect(container).toMatchSnapshot();
    });

    it('calls onChange handler on increment', async () => {
      const user = userEvent.setup();
      const handler = jest.fn();

      render(<IncrementationField value={42} onChange={handler}/>);

      await user.click(screen.getByRole('button', { name: /increment|plus|\+/i }));

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            value: 43
          })
        })
      );
    });

    it('calls onChange handler on decrement', async () => {
      const user = userEvent.setup();
      const handler = jest.fn();

      render(<IncrementationField value={42} onChange={handler}/>);

      await user.click(screen.getByRole('button', { name: /decrement|minus|-/i }));

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            value: 41
          })
        })
      );
    });
  });
});
