import React, { PropTypes, Component } from 'react';
import './BorderLayoutItem.scss';

class BorderLayoutItem extends Component {

  render() {
    return (
      <div className="BorderLayoutItem">{this.props.children}</div>
    );
  }
}

BorderLayoutItem.propTypes = {
  region: PropTypes.string.isRequired,
  children: PropTypes.node,
};

export default BorderLayoutItem;
