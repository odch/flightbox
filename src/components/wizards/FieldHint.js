import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';

const Box = styled.div`
  background-color: ${props => props.theme.colors.background};
  margin: 0.5em 0;
  padding: 0.5em;
  box-sizing: border-box;
`;

const Caption = styled.div`
  font-size: 0.8em;
  margin-bottom: 1em;
  color: ${props => props.theme.colors.danger};
`;

export const Strong = styled.span`
  color: ${props => props.theme.colors.danger};
`

export const Children = styled.div`
  font-size: 0.7em;
`

const FieldHint = props => (
  <Box>
    <Caption>{props.caption}:</Caption>
    <Children>{props.children}</Children>
  </Box>
)

FieldHint.propTypes = {
  caption: PropTypes.string,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ])
};

export default FieldHint;
