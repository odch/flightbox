import PropTypes from 'prop-types';
import React, { Component } from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  margin: 0 0 2em 0;
  border: 1px solid #eee;
  box-shadow: 3px;
`;

const Label = styled.div`
  border-bottom: 1px solid ${props => props.theme.colors.main};
  padding: 1em;
  background-color: ${props => props.theme.colors.background};
`;

const Content = styled.div`
  padding: ${props => typeof props.padding === 'number' ? `${props.padding}px` : '1em'};
  ${props => props.contentMaxHeight > 0 && `max-height: ${props.contentMaxHeight}px;`}
  
  a {
    text-decoration: underline;
  }

  p:not(:last-child) {
    margin-bottom: 1em;
  }
`;

const LabeledBox = props => (
  <Wrapper className={props.className} innerRef={props.innerRef}>
    <Label>{props.label}</Label>
    <Content
      maxHeight={props.contentMaxHeight}
      padding={props.contentPadding}
    >{props.children}</Content>
  </Wrapper>
);

LabeledBox.propTypes = {
  label: PropTypes.string.isRequired,
  className: PropTypes.string,
  contentMaxHeight: PropTypes.number,
  contentPadding: PropTypes.number,
  innerRef: PropTypes.func,
};

export default LabeledBox;
