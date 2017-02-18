import React from 'react';
import styled from 'styled-components';
import HeaderItem from './HeaderItem';

const StyledHeader = styled.div`
  overflow: hidden;
  margin-bottom: 2em;
  border-bottom: 1px solid ${props => props.theme.colors.main};
`;

class Header extends React.PureComponent {

  render() {
    const props = this.props;
    return (
      <StyledHeader>
        <ul>
          {props.tabs.map((tab, index) => (
            <HeaderItem
              key={index}
              index={index}
              label={tab.label}
              active={index === props.activeTab}
              onClick={props.onClick}
            />
          ))}
        </ul>
      </StyledHeader>
    );
  }
}

Header.propTypes = {
  tabs: React.PropTypes.array,
  activeTab: React.PropTypes.number,
  onClick: React.PropTypes.func
};

export default Header;
