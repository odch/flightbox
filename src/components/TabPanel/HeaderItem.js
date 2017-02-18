import React from 'react';
import styled from 'styled-components';

const HeaderLink = styled.a`
  cursor: pointer;
  display: block;
  padding: 1em;
  ${props => props.active && `color: ${props.theme.colors.main};`}
  ${props => props.active && `background-color: ${props.theme.colors.background};`}
  
  &:hover {
    background-color: ${props => props.theme.colors.background}
  }
`;

const StyledHeaderItem = styled.li`
  float: left;
  display: block;
  width: 50%;
  text-align: center;
  font-weight: bold;
  font-size: 1.5em;
`;

class HeaderItem extends React.PureComponent {

  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  render() {
    const props = this.props;
    return (
      <StyledHeaderItem>
        <HeaderLink onClick={this.handleClick} active={props.active}>{props.label}</HeaderLink>
      </StyledHeaderItem>
    );
  }

  handleClick() {
    if (this.props.onClick) {
      this.props.onClick(this.props.index);
    }
  }
}

HeaderItem.propTypes = {
  index: React.PropTypes.number.isRequired,
  label: React.PropTypes.string,
  onClick: React.PropTypes.func,
  active: React.PropTypes.bool
};

export default HeaderItem;
