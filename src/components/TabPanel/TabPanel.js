import React, { PropTypes, Component } from 'react';
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

const HeaderItem = props => (
  <StyledHeaderItem>
    <HeaderLink onClick={props.onClick} active={props.active}>{props.label}</HeaderLink>
  </StyledHeaderItem>
);

const StyledHeader = styled.div`
  overflow: hidden;
  margin-bottom: 2em;
  border-bottom: 1px solid ${props => props.theme.colors.main};
`;

const Header = props => (
  <StyledHeader>
    <ul>
      {props.tabs.map((tab, index) => (
        <HeaderItem
          key={index}
          label={tab.label}
          active={index === props.activeTab}
          onClick={props.onClick.bind(null, index)}
        />
      ))}
    </ul>
  </StyledHeader>
);

class TabPanel extends Component {

  constructor(props) {
    super(props);
    this.state = {
      activeTab: 0
    };
  }

  render() {
    const tab = this.props.tabs[this.state.activeTab];
    return (
      <div className="TabPanel">
        <Header
          tabs={this.props.tabs}
          activeTab={this.state.activeTab}
          onClick={this.tabClick.bind(this)}
        />
        <div className="content">{tab.component}</div>
      </div>
    );
  }

  tabClick(index) {
    this.setState({
      activeTab: index
    });
  }
}

export default TabPanel;
