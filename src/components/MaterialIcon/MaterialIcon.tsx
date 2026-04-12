import PropTypes from 'prop-types';
import React from 'react';
import styled, {css, keyframes} from 'styled-components';

const animations = {
  left: keyframes`
    from { transform: rotate(360deg); }
    to { transform: rotate(0deg); }
  `,
  right: keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  `
};

const I = styled.i<{ $size?: number; $rotate?: string }>`
  font-family: 'Material Icons';
  font-weight: normal;
  font-style: normal;
  font-size: ${props => props.$size}px;
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

  ${props => props.$rotate && css`animation: ${animations[props.$rotate]} 2s linear infinite;`}
`;

const MaterialIcon = ({ icon, className, size = 24, title, rotate }: any) => (
  <I
    className={className}
    $size={size}
    title={title}
    $rotate={rotate}
  >
    {icon}
  </I>
);

MaterialIcon.propTypes = {
  icon: PropTypes.string.isRequired,
  className: PropTypes.string,
  size: PropTypes.number,
  title: PropTypes.string,
  rotate: PropTypes.oneOf(['left', 'right'])
};

export default MaterialIcon;
