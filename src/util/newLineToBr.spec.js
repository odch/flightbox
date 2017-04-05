import React from 'react';
import ReactDOM from 'react-dom';
import expect from 'expect';
import TestUtils from 'react-addons-test-utils';
import bro from 'jsdom-test-browser';
import newLineToBr from './newLineToBr';

describe('util', () => {
  describe('newLineToBr', () => {
    before((done) => { bro.newBrowser(done); });
    before((done) => { bro.jQueryify(done); });

    it('should return the given value if null given', () => {
      const value = null;
      const result = newLineToBr(value);
      expect(result).toBe(null);
    });

    it('should return a span with <br> for each line', () => {
      const value =
        'my\n' +
        'multi\n' +
        'line\n' +
        'text';

      const result = newLineToBr(value);

      const component = TestUtils.renderIntoDocument(<div>{result}</div>);
      const element = ReactDOM.findDOMNode(component);

      expect(bro.$(element).html()).toBe(
        '<span><!-- react-text: 3 -->my<!-- /react-text --><br></span>' +
        '<span><!-- react-text: 6 -->multi<!-- /react-text --><br></span>' +
        '<span><!-- react-text: 9 -->line<!-- /react-text --><br></span>' +
        '<span><!-- react-text: 12 -->text<!-- /react-text --><br></span>'
      );
    });
  });
});
