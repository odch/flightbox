import PropTypes from 'prop-types';
import React from 'react';
import MaterialIcon from '../MaterialIcon';
import StyledButton from './StyledButton';
import Overlay from './Overlay';
import Label from './Label';

class Button extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      hovered: false
    }
  }

  handleMouseEnter() {
    this.setState({
      hovered: true
    })
  }

  handleMouseLeave() {
    this.setState({
      hovered: false
    })
  }

  render() {
    const { type, className, disabled, onClick, icon, label, primary, flat, danger, neutral, dataCy } = this.props;
    return (
      <StyledButton
        type={type}
        className={className}
        onClick={onClick}
        disabled={disabled}
        primary={primary}
        flat={flat}
        danger={danger}
        neutral={neutral}
        onMouseEnter={this.handleMouseEnter.bind(this)}
        onMouseLeave={this.handleMouseLeave.bind(this)}
        data-cy={dataCy}
      >
        <Overlay
          disabled={disabled}
          hovered={this.state.hovered}
          danger={danger}
        >
          {icon && <MaterialIcon icon={icon}/>}<Label>{label}</Label>
        </Overlay>
      </StyledButton>
    );
  }
}

Button.propTypes = {
  type: PropTypes.oneOf(['submit', 'button', 'reset']),
  label: PropTypes.string.isRequired,
  icon: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  primary: PropTypes.bool,
  flat: PropTypes.bool,
  danger: PropTypes.bool,
  neutral: PropTypes.bool,
  dataCy: PropTypes.string
};

Button.defaultProps = {
  type: 'button'
};

export default Button;
