import React from 'react';
import {shallow} from 'enzyme';
import LabeledComponent from './LabeledComponent';

describe('components', () => {
  describe('LabeledComponent', () => {
    it('is built correctly', () => {
      const component = shallow(<LabeledComponent label="My label" component={<input type="text" id="my-input"/>}/>);
      expect(component.debug()).toMatchSnapshot();
    });
  });
});
