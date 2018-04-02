import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';
import bro from 'jsdom-test-browser';
import expect from 'expect';
import { ThemeProvider } from 'styled-components';
import LabeledBox from './LabeledBox';

describe('LabeledBox', () => {
  before((done) => { bro.newBrowser(done); });
  before((done) => { bro.jQueryify(done); });

  it('is built correctly', () => {
    const theme = {
      colors: {
        main: 'blue'
      }
    };
    const labeledBox = (
      <ThemeProvider theme={theme}>
        <LabeledBox label="My label" className="my-class">
          <div>child1</div>
          <div>child2</div>
        </LabeledBox>
      </ThemeProvider>
    );
    const component = TestUtils.renderIntoDocument(labeledBox);
    const element = ReactDOM.findDOMNode(component);

    expect(element.className).toContain('my-class');

    const label = bro.$('> div:nth-child(1)', element);
    expect(label.html()).toBe('My label');

    const content = bro.$('> div:nth-child(2)', element);
    const children = content.children();
    expect(children.length).toBe(2);
    expect(children.eq(0).html()).toBe('child1');
    expect(children.eq(1).html()).toBe('child2');
  });
});
