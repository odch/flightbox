import React from 'react';
import {shallow} from 'enzyme';
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

      const component = shallow(labeledBox);

      expect(component.debug()).toMatchSnapshot();
    });
  });
});
