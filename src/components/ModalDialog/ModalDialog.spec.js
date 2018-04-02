import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';
import expect from 'expect';
import { ThemeProvider } from 'styled-components';
import ModalDialog from './ModalDialog';
import Utils from '../../../test/Utils';

describe('components', () => {
  describe('ModalDialog', () => {
    it('renders given content', () => {
      const content = <div>My test content</div>;
      const modalDialog = (
        <ThemeProvider theme={{}}>
          <ModalDialog content={content}/>
        </ThemeProvider>
      );

      const component = TestUtils.renderIntoDocument(modalDialog);
      const element = ReactDOM.findDOMNode(component);

      const contentWrapper = element.childNodes[1];
      const contentNode = contentWrapper.childNodes[0];

      expect(contentNode.innerHTML).toBe('My test content');
    });

    it('calls onBlur handler on mask click', () => {
      const handler = Utils.callTracker();

      const content = <div>My test content</div>;
      const modalDialog = (
        <ThemeProvider theme={{}}>
          <ModalDialog content={content} onBlur={handler}/>
        </ThemeProvider>
      );

      const component = TestUtils.renderIntoDocument(modalDialog);
      const element = ReactDOM.findDOMNode(component);

      const mask = element.childNodes[0];

      TestUtils.Simulate.click(mask);

      const calls = handler.calls();
      expect(calls.length).toBe(1);
    });
  });
});
