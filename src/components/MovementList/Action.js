import PropTypes from 'prop-types';
import React from 'react';
import MaterialIcon from '../MaterialIcon';
import styled from 'styled-components';

const StyledAction = styled.span`
  ${props => props.$disabled
    ? `
      color: #ddd;
    `
    : `
      cursor: pointer;

      &:hover {
        color: ${props.theme.colors.main};
      }
    `
  }
`;

const ActionLabel = styled.span`
  ${props => props.$responsive && `
    @media (max-width: 1200px) {
      display: none;
    }`
  }
`;

class Action extends React.PureComponent {

  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(e) {
    e.stopPropagation();
    if (!this.props.disabled) {
      this.props.onClick();
    }
  }

  render() {
    return (
      <StyledAction onClick={this.handleClick} className={this.props.className} $disabled={this.props.disabled}>
        <MaterialIcon icon={this.props.icon} rotate={this.props.rotateIcon}/>
        <ActionLabel $responsive={this.props.responsive}>&nbsp;{this.props.label}</ActionLabel>
      </StyledAction>
    );
  }
}

Action.propTypes = {
  className: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  responsive: PropTypes.bool,
  rotateIcon: PropTypes.oneOf(['left', 'right'])
};

export default Action;
