import React from 'react';
import {shallow} from 'enzyme';
import ModalDialog from './ModalDialog';
import Mask from './Mask';

describe('components', () => {
  describe('ModalDialog', () => {
    it('renders given content', () => {
      const content = <div>My test content</div>;
      const modalDialog = <ModalDialog content={content}/>;

      const component = shallow(modalDialog);

      expect(component.debug()).toMatchSnapshot();
    });

    it('calls onBlur handler on mask click', () => {
      const handler = jest.fn();

      const content = <div>My test content</div>;
      const modalDialog = <ModalDialog content={content} onBlur={handler}/>;

      const component = shallow(modalDialog);

      component.find(Mask).simulate('click');

      const calls = handler.mock.calls;
      expect(calls.length).toBe(1);
    });
  });
});
