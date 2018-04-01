import PropTypes from 'prop-types';
import React from 'react';
import styled, {keyframes} from 'styled-components';

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

const I = styled.i`
  font-family: 'Material Icons';
  font-weight: normal;
  font-style: normal;
  font-size: ${props => props.size}px;
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
  
  ${props => props.rotate && `animation: ${animations[props.rotate]} 2s linear infinite;`}
`;

class MaterialIcon extends React.PureComponent {
  render() {
    return (
      <I
        className={this.props.className}
        size={this.props.size}
        title={this.props.title}
        rotate={this.props.rotate}
      >
        {this.props.icon}
      </I>
    );
  }
}

MaterialIcon.propTypes = {
  icon: PropTypes.string.isRequired,
  className: PropTypes.string,
  size: PropTypes.number,
  title: PropTypes.string,
  rotate: PropTypes.oneOf(['left', 'right'])
};

MaterialIcon.defaultProps = {
  size: 24
};

export default MaterialIcon;
