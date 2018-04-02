import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';
import bro from 'jsdom-test-browser';
import expect from 'expect';
import IncrementationField from './IncrementationField';
import Utils from '../../../test/Utils';

describe('IncrementationField', () => {
  before((done) => { bro.newBrowser(done); });
  before((done) => { bro.jQueryify(done); });

  it('is initialized with value', () => {
    const component = TestUtils.renderIntoDocument(<IncrementationField value={42}/>);
    const element = ReactDOM.findDOMNode(component);

    expect(component.state.value).toBe(42);
    expect(bro.$('span', element).html()).toBe('42');
  });

  it('is initialized with value if value and min value is specified', () => {
    const component = TestUtils.renderIntoDocument(<IncrementationField value={42} minValue={3}/>);
    const element = ReactDOM.findDOMNode(component);

    expect(component.state.value).toBe(42);
    expect(bro.$('span', element).html()).toBe('42');
  });

  it('throws error if specified value is lower than min value', () => {
    expect(() => TestUtils.renderIntoDocument(<IncrementationField value={2} minValue={3}/>))
      .toThrow('Given value 2 is lower than min value 3');
  });

  it('is initialized with 0 if no value and min value is specified', () => {
    const component = TestUtils.renderIntoDocument(<IncrementationField/>);
    const element = ReactDOM.findDOMNode(component);

    expect(component.state.value).toBe(0);
    expect(bro.$('span', element).html()).toBe('0');
  });

  it('is initialized with min value if no value is specified', () => {
    const component = TestUtils.renderIntoDocument(<IncrementationField minValue={3}/>);
    const element = ReactDOM.findDOMNode(component);

    expect(component.state.value).toBe(3);
    expect(bro.$('span', element).html()).toBe('3');
  });

  it('is incremented by 1 on increment button click', () => {
    const component = TestUtils.renderIntoDocument(<IncrementationField/>);
    const element = ReactDOM.findDOMNode(component);
    const button = bro.$('button:last-child', element).get(0);

    TestUtils.Simulate.click(button);

    expect(component.state.value).toBe(1);
    expect(bro.$('span', element).html()).toBe('1');
  });

  it('is decremented by 1 on decrement button click', () => {
    const component = TestUtils.renderIntoDocument(<IncrementationField value={42}/>);
    const element = ReactDOM.findDOMNode(component);
    const button = bro.$('button:first-child', element).get(0);

    TestUtils.Simulate.click(button);

    expect(component.state.value).toBe(41);
    expect(bro.$('span', element).html()).toBe('41');
  });

  it('cannot have value lower than min value', () => {
    const component = TestUtils.renderIntoDocument(<IncrementationField minValue={3}/>);
    const element = ReactDOM.findDOMNode(component);
    const button = bro.$('button:first-child', element).get(0);

    TestUtils.Simulate.click(button);

    expect(component.state.value).toBe(3);
    expect(bro.$('span', element).html()).toBe('3');
  });

  it('calls onChange handler on increment', () => {
    const handler = Utils.callTracker();
    const component = TestUtils.renderIntoDocument(<IncrementationField value={42} onChange={handler}/>);
    const element = ReactDOM.findDOMNode(component);
    const button = bro.$('button:last-child', element).get(0);

    TestUtils.Simulate.click(button);

    const calls = handler.calls();
    expect(calls.length).toBe(1);
    expect(calls[0][0].target.value).toBe(43);
  });

  it('calls onChange handler on decrement', () => {
    const handler = Utils.callTracker();
    const component = TestUtils.renderIntoDocument(<IncrementationField value={42} onChange={handler}/>);
    const element = ReactDOM.findDOMNode(component);
    const button = bro.$('button:first-child', element).get(0);

    TestUtils.Simulate.click(button);

    const calls = handler.calls();
    expect(calls.length).toBe(1);
    expect(calls[0][0].target.value).toBe(41);
  });
});
