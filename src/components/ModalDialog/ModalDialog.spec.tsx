import React from 'react';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModalDialog from './ModalDialog';

describe('components', () => {
  describe('ModalDialog', () => {
    it('renders given content', () => {
      const content = <div>My test content</div>;
      const modalDialog = <ModalDialog content={content}/>;

      const { container } = render(modalDialog);

      expect(container).toMatchSnapshot();
    });

    it('calls onBlur handler on mask click', async () => {
      const user = userEvent.setup();
      const handler = jest.fn();

      const content = <div>My test content</div>;
      const modalDialog = <ModalDialog content={content} onBlur={handler}/>;

      render(modalDialog);

      await user.click(screen.getByTestId('modal-mask'));

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });
});
