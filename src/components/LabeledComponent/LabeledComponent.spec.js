import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';
import bro from 'jsdom-test-browser';
import expect from 'expect';
import LabeledComponent from './LabeledComponent';

describe('LabeledComponent', () => {
  before((done) => { bro.newBrowser(done); });
  before((done) => { bro.jQueryify(done); });

  it('is built correctly', () => {
    const labeledComponent = <LabeledComponent label="My label" component={<input type="text" id="my-input"/>}/>;
    const component = TestUtils.renderIntoDocument(labeledComponent);
    const element = ReactDOM.findDOMNode(component);

    expect(bro.$('label', element).html()).toBe('My label');
    expect(bro.$('input', element).length).toBe(1);
    expect(bro.$('input', element).get(0).id).toBe('my-input');
  });
});
