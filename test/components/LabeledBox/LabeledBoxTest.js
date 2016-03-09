import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';
import bro from 'jsdom-test-browser';
import expect from 'expect';
import LabeledBox from '../../../src/components/LabeledBox';

describe('LabeledBox', () => {
  before((done) => { bro.newBrowser(done); });
  before((done) => { bro.jQueryify(done); });

  it('is built correctly', () => {
    const labeledBox = (
      <LabeledBox label="My label" className="my-class">
        <div>child1</div>
        <div>child2</div>
      </LabeledBox>);
    const component = TestUtils.renderIntoDocument(labeledBox);
    const element = ReactDOM.findDOMNode(component);

    expect(element.className).toBe('LabeledBox my-class');
    expect(bro.$('div.label', element).html()).toBe('My label');

    const children = bro.$('div.content', element).children();
    expect(children.length).toBe(2);
    expect(children.eq(0).html()).toBe('child1');
    expect(children.eq(1).html()).toBe('child2');
  });
});
