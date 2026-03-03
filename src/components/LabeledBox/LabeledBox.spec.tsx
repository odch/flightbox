import React from 'react';
import {render} from '@testing-library/react';
import LabeledBox from './LabeledBox';

describe('components', () => {
  describe('LabeledBox', () => {
    it('is built correctly', () => {
      const labeledBox = (
        <LabeledBox label="My label" className="my-class">
          <div>child1</div>
          <div>child2</div>
        </LabeledBox>
      );

      const { container } = render(labeledBox);

      expect(container).toMatchSnapshot();
    });
  });
});
