import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';
import bro from 'jsdom-test-browser';
import expect from 'expect';
import IncrementationField from '../components/IncrementationField';

describe('IncrementationField', () => {
  before((done) => { bro.newBrowser(done); });
  before((done) => { bro.jQueryify(done); });

  const callTracker = () => {
    const calls = [];
    const f = (...args) => {
      calls.push(args);
    };
    f.calls = () => {
      return calls;
    };
    return f;
  };

  it('is initialized with value', () => {
    const component = TestUtils.renderIntoDocument(<IncrementationField value={42}/>);
    const element = ReactDOM.findDOMNode(component);

    expect(component.state.value).toBe(42);
    expect(bro.$('.value', element).html()).toBe('42');
  });

  it('is initialized with 0 if no value is specified', () => {
    const component = TestUtils.renderIntoDocument(<IncrementationField/>);
    const element = ReactDOM.findDOMNode(component);

    expect(component.state.value).toBe(0);
    expect(bro.$('.value', element).html()).toBe('0');
  });

  it('is incremented by 1 on increment button click', () => {
    const component = TestUtils.renderIntoDocument(<IncrementationField/>);
    const element = ReactDOM.findDOMNode(component);
    const button = bro.$('.increment', element).get(0);

    TestUtils.Simulate.click(button);

    expect(component.state.value).toBe(1);
    expect(bro.$('.value', element).html()).toBe('1');
  });

  it('is decremented by 1 on decrement button click', () => {
    const component = TestUtils.renderIntoDocument(<IncrementationField value={42}/>);
    const element = ReactDOM.findDOMNode(component);
    const button = bro.$('.decrement', element).get(0);

    TestUtils.Simulate.click(button);

    expect(component.state.value).toBe(41);
    expect(bro.$('.value', element).html()).toBe('41');
  });

  it('cannot have negative value', () => {
    const component = TestUtils.renderIntoDocument(<IncrementationField/>);
    const element = ReactDOM.findDOMNode(component);
    const button = bro.$('.decrement', element).get(0);

    TestUtils.Simulate.click(button);

    expect(component.state.value).toBe(0);
    expect(bro.$('.value', element).html()).toBe('0');
  });

  it('calls onChange handler on increment', () => {
    const handler = callTracker();
    const component = TestUtils.renderIntoDocument(<IncrementationField value={42} onChange={handler}/>);
    const element = ReactDOM.findDOMNode(component);
    const button = bro.$('.increment', element).get(0);

    TestUtils.Simulate.click(button);

    const calls = handler.calls();
    expect(calls.length).toBe(1);
    expect(calls[0][0].target.value).toBe(43);
  });

  it('calls onChange handler on decrement', () => {
    const handler = callTracker();
    const component = TestUtils.renderIntoDocument(<IncrementationField value={42} onChange={handler}/>);
    const element = ReactDOM.findDOMNode(component);
    const button = bro.$('.decrement', element).get(0);

    TestUtils.Simulate.click(button);

    const calls = handler.calls();
    expect(calls.length).toBe(1);
    expect(calls[0][0].target.value).toBe(41);
  });
});
