import React, {PropTypes} from 'react';
import MaterialIcon from '../MaterialIcon';
import styled from 'styled-components';

const StyledAction = styled.span`
  cursor: pointer;
  
  &:hover {
    color: ${props => props.theme.colors.main};
  }
`;

const ActionLabel = styled.span`
  @media (max-width: 980px) {
    display: none;
  }
`;

class Action extends React.PureComponent {
  render() {
    return (
      <StyledAction onClick={this.props.onClick} className={this.props.className}>
        <MaterialIcon icon={this.props.icon}/><ActionLabel>&nbsp;{this.props.label}</ActionLabel>
      </StyledAction>
    );
  }
}

export default Action;
