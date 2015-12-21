import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';
import bro from 'jsdom-test-browser';
import expect from 'expect';
import RadioGroup from '../components/RadioGroup';
import Utils from './Utils.js';

describe('RadioGroup', () => {
  before((done) => { bro.newBrowser(done); });
  before((done) => { bro.jQueryify(done); });

  const items = [{
    value: 'yes',
    label: 'ja',
  }, {
    value: 'no',
    label: 'nein',
  }];

  it('is initialized with value', () => {
    const component = TestUtils.renderIntoDocument(<RadioGroup name="test" items={items} value="yes"/>);
    const element = ReactDOM.findDOMNode(component);

    expect(component.state.value).toBe('yes');
    expect(bro.$('input[value=yes]', element).get(0).checked).toBe(true);
    expect(bro.$('input[value=no]', element).get(0).checked).toBe(false);
  });

  it('has no value if value not specified', () => {
    const component = TestUtils.renderIntoDocument(<RadioGroup name="test" items={items}/>);
    const element = ReactDOM.findDOMNode(component);

    expect(component.state.value).toBe(null);
    expect(bro.$('input[value=yes]', element).get(0).checked).toBe(false);
    expect(bro.$('input[value=no]', element).get(0).checked).toBe(false);
  });

  it('has new value after change', () => {
    const component = TestUtils.renderIntoDocument(<RadioGroup name="test" value="no" items={items}/>);
    const element = ReactDOM.findDOMNode(component);
    const button = bro.$('input[value=yes]', element).get(0);

    TestUtils.Simulate.change(button, { target: { checked: true, value: 'yes' } });

    expect(component.state.value).toBe('yes');
    expect(bro.$('input[value=yes]', element).get(0).checked).toBe(true);
    expect(bro.$('input[value=no]', element).get(0).checked).toBe(false);
  });

  it('calls onChange handler on initial select', () => {
    const handler = Utils.callTracker();
    const component = TestUtils.renderIntoDocument(<RadioGroup name="test" items={items} onChange={handler}/>);
    const element = ReactDOM.findDOMNode(component);
    const button = bro.$('input[value=yes]', element).get(0);

    TestUtils.Simulate.change(button, { target: { checked: true, value: 'yes' } });

    const calls = handler.calls();
    expect(calls.length).toBe(1);
    expect(calls[0][0].target.value).toBe('yes');
  });

  it('calls onChange handler on change', () => {
    const handler = Utils.callTracker();
    const component = TestUtils.renderIntoDocument(<RadioGroup name="test" items={items} value="yes" onChange={handler}/>);
    const element = ReactDOM.findDOMNode(component);
    const button = bro.$('input[value=no]', element).get(0);

    TestUtils.Simulate.change(button, { target: { checked: true, value: 'no' } });

    const calls = handler.calls();
    expect(calls.length).toBe(1);
    expect(calls[0][0].target.value).toBe('no');
  });
});
