import React from 'react';
import Header from './Header';

class TabPanel extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      activeTab: 0
    };
    this.handleTabClick = this.handleTabClick.bind(this);
  }

  render() {
    const tab = this.props.tabs[this.state.activeTab];
    return (
      <div>
        <Header
          tabs={this.props.tabs}
          activeTab={this.state.activeTab}
          onClick={this.handleTabClick}
        />
        <div>{tab.component}</div>
      </div>
    );
  }

  handleTabClick(index) {
    this.setState({
      activeTab: index
    });
  }
}

TabPanel.propTypes = {
  tabs: React.PropTypes.arrayOf(
    React.PropTypes.shape({
      component: React.PropTypes.element.isRequired
    })
  ).isRequired
};

export default TabPanel;
