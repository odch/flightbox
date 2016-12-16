import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';
import bro from 'jsdom-test-browser';
import expect from 'expect';
import LabeledComponent from './LabeledComponent';

describe('LabeledComponent', () => {
  before((done) => { bro.newBrowser(done); });
  before((done) => { bro.jQueryify(done); });

  it('is built correctly', () => {
    const labeledComponent = <LabeledComponent label="My label" className="my-class" component={<input type="text" id="my-input"/>}/>;
    const component = TestUtils.renderIntoDocument(labeledComponent);
    const element = ReactDOM.findDOMNode(component);

    expect(element.className).toBe('LabeledComponent my-class');
    expect(bro.$('label', element).html()).toBe('My label');
    expect(bro.$('.component-wrap input', element).length).toBe(1);
    expect(bro.$('.component-wrap input', element).get(0).id).toBe('my-input');
  });
});
