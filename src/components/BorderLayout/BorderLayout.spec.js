import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';
import bro from 'jsdom-test-browser';
import expect from 'expect';
import BorderLayout from './BorderLayout';
import BorderLayoutItem from '../BorderLayoutItem';

describe('BorderLayout', () => {
  before((done) => { bro.newBrowser(done); });
  before((done) => { bro.jQueryify(done); });

  it('sets given class name', () => {
    const borderLayoutComponent = (
      <BorderLayout className="my-class"/>
    );
    const component = TestUtils.renderIntoDocument(borderLayoutComponent);
    const element = ReactDOM.findDOMNode(component);

    expect(element.className).toBe('BorderLayout my-class');
  });

  it('works without items', () => {
    const borderLayoutComponent = (
      <BorderLayout/>
    );
    const component = TestUtils.renderIntoDocument(borderLayoutComponent);
    const element = ReactDOM.findDOMNode(component);

    expect(element.className).toBe('BorderLayout');
    expect(bro.$('.west', element).children().length).toBe(0);
    expect(bro.$('.east', element).children().length).toBe(0);
    expect(bro.$('.north', element).children().length).toBe(0);
    expect(bro.$('.middle', element).children().length).toBe(0);
    expect(bro.$('.south', element).children().length).toBe(0);
  });

  it('works with east item', () => {
    const east = <div className="my-east">my east</div>;
    const borderLayoutComponent = (
      <BorderLayout>
        <BorderLayoutItem region="east">{east}</BorderLayoutItem>
      </BorderLayout>
    );
    const component = TestUtils.renderIntoDocument(borderLayoutComponent);
    const element = ReactDOM.findDOMNode(component);

    expect(element.className).toBe('BorderLayout east-visible');
    expect(bro.$('.west', element).children().length).toBe(0);
    expect(bro.$('.north', element).children().length).toBe(0);
    expect(bro.$('.middle', element).children().length).toBe(0);
    expect(bro.$('.south', element).children().length).toBe(0);

    const eastChildren = bro.$('.east', element).children();
    expect(eastChildren.length).toBe(1);
    expect(eastChildren.get(0).className).toBe('BorderLayoutItem');
    expect(eastChildren.children().length).toBe(1);
    expect(eastChildren.children().get(0).className).toBe('my-east');
    expect(eastChildren.children().html()).toBe('my east');
  });

  it('works with west item', () => {
    const west = <div className="my-west">my west</div>;
    const borderLayoutComponent = (
      <BorderLayout>
        <BorderLayoutItem region="west">{west}</BorderLayoutItem>
      </BorderLayout>
    );
    const component = TestUtils.renderIntoDocument(borderLayoutComponent);
    const element = ReactDOM.findDOMNode(component);

    expect(element.className).toBe('BorderLayout west-visible');
    expect(bro.$('.east', element).children().length).toBe(0);
    expect(bro.$('.north', element).children().length).toBe(0);
    expect(bro.$('.middle', element).children().length).toBe(0);
    expect(bro.$('.south', element).children().length).toBe(0);

    const westChildren = bro.$('.west', element).children();
    expect(westChildren.length).toBe(1);
    expect(westChildren.get(0).className).toBe('BorderLayoutItem');
    expect(westChildren.children().length).toBe(1);
    expect(westChildren.children().get(0).className).toBe('my-west');
    expect(westChildren.children().html()).toBe('my west');
  });

  it('works with north item', () => {
    const north = <div className="my-north">my north</div>;
    const borderLayoutComponent = (
      <BorderLayout>
        <BorderLayoutItem region="north">{north}</BorderLayoutItem>
      </BorderLayout>
    );
    const component = TestUtils.renderIntoDocument(borderLayoutComponent);
    const element = ReactDOM.findDOMNode(component);

    expect(element.className).toBe('BorderLayout north-visible');
    expect(bro.$('.east', element).children().length).toBe(0);
    expect(bro.$('.west', element).children().length).toBe(0);
    expect(bro.$('.middle', element).children().length).toBe(0);
    expect(bro.$('.south', element).children().length).toBe(0);

    const northChildren = bro.$('.north', element).children();
    expect(northChildren.length).toBe(1);
    expect(northChildren.get(0).className).toBe('BorderLayoutItem');
    expect(northChildren.children().length).toBe(1);
    expect(northChildren.children().get(0).className).toBe('my-north');
    expect(northChildren.children().html()).toBe('my north');
  });

  it('works with south item', () => {
    const south = <div className="my-south">my south</div>;
    const borderLayoutComponent = (
      <BorderLayout>
        <BorderLayoutItem region="south">{south}</BorderLayoutItem>
      </BorderLayout>
    );
    const component = TestUtils.renderIntoDocument(borderLayoutComponent);
    const element = ReactDOM.findDOMNode(component);

    expect(element.className).toBe('BorderLayout south-visible');
    expect(bro.$('.east', element).children().length).toBe(0);
    expect(bro.$('.west', element).children().length).toBe(0);
    expect(bro.$('.north', element).children().length).toBe(0);
    expect(bro.$('.middle', element).children().length).toBe(0);

    const southChildren = bro.$('.south', element).children();
    expect(southChildren.length).toBe(1);
    expect(southChildren.get(0).className).toBe('BorderLayoutItem');
    expect(southChildren.children().length).toBe(1);
    expect(southChildren.children().get(0).className).toBe('my-south');
    expect(southChildren.children().html()).toBe('my south');
  });

  it('works with middle item', () => {
    const middle = <div className="my-middle">my middle</div>;
    const borderLayoutComponent = (
      <BorderLayout>
        <BorderLayoutItem region="middle">{middle}</BorderLayoutItem>
      </BorderLayout>
    );
    const component = TestUtils.renderIntoDocument(borderLayoutComponent);
    const element = ReactDOM.findDOMNode(component);

    expect(element.className).toBe('BorderLayout middle-visible');
    expect(bro.$('.east', element).children().length).toBe(0);
    expect(bro.$('.west', element).children().length).toBe(0);
    expect(bro.$('.north', element).children().length).toBe(0);
    expect(bro.$('.south', element).children().length).toBe(0);

    const middleChildren = bro.$('.middle', element).children();
    expect(middleChildren.length).toBe(1);
    expect(middleChildren.get(0).className).toBe('BorderLayoutItem');
    expect(middleChildren.children().length).toBe(1);
    expect(middleChildren.children().get(0).className).toBe('my-middle');
    expect(middleChildren.children().html()).toBe('my middle');
  });

  it('works with multiple items', () => {
    const west = <div className="my-west">my west</div>;
    const middle = <div className="my-middle">my middle</div>;

    const borderLayoutComponent = (
      <BorderLayout>
        <BorderLayoutItem region="west">{west}</BorderLayoutItem>
        <BorderLayoutItem region="middle">{middle}</BorderLayoutItem>
      </BorderLayout>
    );
    const component = TestUtils.renderIntoDocument(borderLayoutComponent);
    const element = ReactDOM.findDOMNode(component);

    expect(element.className).toBe('BorderLayout west-visible middle-visible');
    expect(bro.$('.east', element).children().length).toBe(0);
    expect(bro.$('.north', element).children().length).toBe(0);
    expect(bro.$('.south', element).children().length).toBe(0);

    const westChildren = bro.$('.west', element).children();
    expect(westChildren.length).toBe(1);
    expect(westChildren.get(0).className).toBe('BorderLayoutItem');
    expect(westChildren.children().length).toBe(1);
    expect(westChildren.children().get(0).className).toBe('my-west');
    expect(westChildren.children().html()).toBe('my west');

    const middleChildren = bro.$('.middle', element).children();
    expect(middleChildren.length).toBe(1);
    expect(middleChildren.get(0).className).toBe('BorderLayoutItem');
    expect(middleChildren.children().length).toBe(1);
    expect(middleChildren.children().get(0).className).toBe('my-middle');
    expect(middleChildren.children().html()).toBe('my middle');
  });
});
