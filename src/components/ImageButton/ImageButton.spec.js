import React from 'react';
import {shallow} from 'enzyme';
import ImageButton from './ImageButton';

describe('components', () => {
  describe('ImageButton', () => {
    it('renders label and image', () => {
      const component = shallow(<ImageButton label="my label" img="imgsource.jpg"/>);

      expect(component.debug()).toMatchSnapshot();
    });

    it('propagates href to OptionalLink', () => {
      const component = shallow(<ImageButton label="" img="" href="/some/path"/>);

      expect(component.debug()).toMatchSnapshot();
    });

    it('propagates onClick to OptionalLink', () => {
      const component = shallow(<ImageButton label="" img="" onClick={() => {}}/>);

      expect(component.debug()).toMatchSnapshot();
    });
  });
});
