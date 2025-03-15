import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  margin: 0 0 2em 0;
  border: 1px solid #ddd;
  box-shadow: 0 -1px 0 rgba(0,0,0,.03), 0 0 2px rgba(0,0,0,.03), 0 2px 4px rgba(0,0,0,.06);
  background-color: #fefefe;
`;

const Label = styled.div`
  padding: ${props => typeof props.padding === 'number' ? `${props.padding}px` : '1rem'};
  font-weight: bold;
  font-size: 1.5em;
`;

const Content = styled.div`
  padding: ${props => typeof props.padding === 'number' ? `${props.padding}px` : '1rem'};
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
