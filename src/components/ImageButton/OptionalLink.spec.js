import React from 'react';
import {shallow} from 'enzyme';
import ImageButton from './ImageButton';
import OptionalLink from "./OptionalLink";

describe('components', () => {
  describe('ImageButton', () => {
    describe('OptionalLink', () => {
      it('renders Link component if `href` prop is set', () => {
        const component = shallow(<OptionalLink href="/some/path"/>);

        expect(component.debug()).toMatchSnapshot();
      });

      it('renders no Link component if `href` prop is not set', () => {
        const component = shallow(<OptionalLink onClick={() => {
        }}/>);

        expect(component.debug()).toMatchSnapshot();
      });
    });
  });
});
