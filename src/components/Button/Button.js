import React from 'react';
import MaterialIcon from '../MaterialIcon';
import StyledButton from './StyledButton';

const Button = props => (
  <StyledButton
    type={props.type}
    className={props.className}
    disabled={props.disabled}
  >
    {props.icon && <MaterialIcon icon={props.icon}/>}{props.label}
  </StyledButton>
);

Button.propTypes = {
  type: React.PropTypes.oneOf(['submit', 'button', 'reset']),
  label: React.PropTypes.string.isRequired,
  icon: React.PropTypes.string,
  className: React.PropTypes.string,
  disabled: React.PropTypes.bool
};

Button.defaultProps = {
  type: 'button'
};

export default Button;
