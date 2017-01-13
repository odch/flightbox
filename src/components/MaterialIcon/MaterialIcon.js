import React from 'react';
import styled from 'styled-components';

const I = styled.i`
  font-family: 'Material Icons';
  font-weight: normal;
  font-style: normal;
  font-size: 24px;  /* Preferred icon size */
  display: inline-block;
  width: 1em;
  height: 1em;
  line-height: 1;
  text-transform: none;
  letter-spacing: normal;
  word-wrap: normal;
  white-space: nowrap;
  direction: ltr;

  /* Support for all WebKit browsers. */
  -webkit-font-smoothing: antialiased;
  /* Support for Safari and Chrome. */
  text-rendering: optimizeLegibility;

  /* Support for Firefox. */
  -moz-osx-font-smoothing: grayscale;

  /* Support for IE. */
  font-feature-settings: 'liga';
  
  /* align vertically with text */
  vertical-align: middle;
`;

const MaterialIcon = props => (
  <I className={props.className}>{props.icon}</I>
);

MaterialIcon.propTypes = {
  icon: React.PropTypes.string.isRequired,
  className: React.PropTypes.string
};

export default MaterialIcon;
