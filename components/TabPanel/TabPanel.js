import React, { PropTypes, Component } from 'react';
import './TabPanel.scss';

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
        <div className="header">
          <ul>
            {this.props.tabs.map(function(tab, index) {
              let className = '';
              if (index === this.state.activeTab) {
                className += ' active';
              }
              return (
                <li className={className} key={index}>
                  <a onClick={this.tabClick.bind(this, index)}>{tab.label}</a>
                </li>
              );
            }, this)}
          </ul>
        </div>
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
