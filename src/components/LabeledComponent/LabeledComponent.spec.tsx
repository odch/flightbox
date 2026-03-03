import React from 'react';
import {render} from '@testing-library/react';
import LabeledComponent from './LabeledComponent';

describe('components', () => {
  describe('LabeledComponent', () => {
    it('is built correctly', () => {
      const { container } = render(<LabeledComponent label="My label" component={<input type="text" id="my-input"/>}/>);
      expect(container).toMatchSnapshot();
    });
  });
});
