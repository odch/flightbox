import React from 'react';
import {shallow} from 'enzyme';
import IncrementationField from './IncrementationField';
import Button from './Button';

describe('components', () => {
  describe('IncrementationField', () => {
    it('is initialized with value', () => {
      const component = shallow(<IncrementationField value={42}/>);
      expect(component.debug()).toMatchSnapshot();
    });

    it('is initialized with value if value and min value is specified', () => {
      const component = shallow(<IncrementationField value={42} minValue={3}/>);
      expect(component.debug()).toMatchSnapshot();
    });

    it('throws error if specified value is lower than min value', () => {
      expect(() => shallow(<IncrementationField value={2} minValue={3}/>))
        .toThrow('Given value 2 is lower than min value 3');
    });

    it('is initialized with 0 if no value and min value is specified', () => {
      const component = shallow(<IncrementationField/>);
      expect(component.debug()).toMatchSnapshot();
    });

    it('is initialized with min value if no value is specified', () => {
      const component = shallow(<IncrementationField minValue={3}/>);
      expect(component.debug()).toMatchSnapshot();
    });

    it('is incremented by 1 on increment button click', () => {
      const incrementationField = shallow(<IncrementationField/>);

      expect(incrementationField.debug()).toMatchSnapshot();

      incrementationField.find(Button).at(1).simulate('click');

      expect(incrementationField.debug()).toMatchSnapshot();
    });

    it('is decremented by 1 on decrement button click', () => {
      const incrementationField = shallow(<IncrementationField value={42}/>);

      expect(incrementationField.debug()).toMatchSnapshot();

      incrementationField.find(Button).at(0).simulate('click');

      expect(incrementationField.debug()).toMatchSnapshot();
    });

    it('cannot have value lower than min value', () => {
      const incrementationField = shallow(<IncrementationField minValue={3}/>);

      expect(incrementationField.debug()).toMatchSnapshot();

      incrementationField.find(Button).at(0).simulate('click');

      expect(incrementationField.debug()).toMatchSnapshot();
    });

    it('calls onChange handler on increment', () => {
      const handler = jest.fn();

      const incrementationField = shallow(<IncrementationField value={42} onChange={handler}/>);

      incrementationField.find(Button).at(1).simulate('click');

      const calls = handler.mock.calls;
      expect(calls.length).toBe(1);
      expect(calls[0][0].target.value).toBe(43);
    });

    it('calls onChange handler on decrement', () => {
      const handler = jest.fn();

      const incrementationField = shallow(<IncrementationField value={42} onChange={handler}/>);

      incrementationField.find(Button).at(0).simulate('click');

      const calls = handler.mock.calls;
      expect(calls.length).toBe(1);
      expect(calls[0][0].target.value).toBe(41);
    });
  });
});
