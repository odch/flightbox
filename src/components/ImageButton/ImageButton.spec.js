import React from 'react';
import TestUtils from 'react-dom/test-utils';
import expect from 'expect';
import ImageButton from './ImageButton';
import {MemoryRouter, Link} from 'react-router-dom';

describe('components', () => {
  describe('ImageButton', () => {
    it('renders Link components if `href` prop is set', () => {
      const testComponent = (
        <MemoryRouter>
          <ImageButton href="/some/path"/>
        </MemoryRouter>
      );
      const wrapper = TestUtils.renderIntoDocument(testComponent);

      const links = TestUtils.scryRenderedComponentsWithType(wrapper, Link);
      expect(links.length).toBe(2);
    });

    it('renders no Link components if `href` prop is not set', () => {
      const testComponent = (
        <MemoryRouter>
          <ImageButton onClick={() => {}}/>
        </MemoryRouter>
      );
      const wrapper = TestUtils.renderIntoDocument(testComponent);

      const links = TestUtils.scryRenderedComponentsWithType(wrapper, Link);
      expect(links.length).toBe(0);
    });
  });
});
