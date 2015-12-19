import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';
import bro from 'jsdom-test-browser';
import expect from 'expect';
import IncrementationField from '../components/IncrementationField';

describe('IncrementationField', () => {
  before((done) => { bro.newBrowser(done); });
  before((done) => { bro.jQueryify(done); });

  describe('element HTML', () => {
    let element;

    beforeEach(() => {
      const component = TestUtils.renderIntoDocument(<IncrementationField value={42}/>);
      element = ReactDOM.findDOMNode(component);
    });

    it('is initialized with value', () => {
      expect(bro.$('.value', element).html()).toBe('42');
    });
  });
});
