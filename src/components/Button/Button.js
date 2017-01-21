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
    const { type, className, disabled, onClick, icon, label } = this.props;
    return (
      <StyledButton
        type={type}
        className={className}
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={this.handleMouseEnter.bind(this)}
        onMouseLeave={this.handleMouseLeave.bind(this)}
      >
        <Overlay
          disabled={disabled}
          hovered={this.state.hovered}
        >
          {icon && <MaterialIcon icon={icon}/>}<Label>{label}</Label>
        </Overlay>
      </StyledButton>
    );
  }
}

Button.propTypes = {
  type: React.PropTypes.oneOf(['submit', 'button', 'reset']),
  label: React.PropTypes.string.isRequired,
  icon: React.PropTypes.string,
  className: React.PropTypes.string,
  disabled: React.PropTypes.bool,
  onClick: React.PropTypes.func
};

Button.defaultProps = {
  type: 'button'
};

export default Button;
