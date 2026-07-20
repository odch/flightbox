import React from 'react';
import {render} from '@testing-library/react';
import LabeledComponent from './LabeledComponent';

describe('components', () => {
  describe('LabeledComponent', () => {
    it('is built correctly', () => {
      const { container } = render(<LabeledComponent label="My label" component={<input type="text" id="my-input"/>}/>);
      expect(container).toMatchSnapshot();
    });

    it('renders a footer when provided', () => {
      const { getByTestId } = render(
        <LabeledComponent
          label="My label"
          component={<input type="text" id="my-input"/>}
          footer={<div data-testid="footer">chips</div>}
        />
      );
      expect(getByTestId('footer')).toBeTruthy();
    });
  });
});
