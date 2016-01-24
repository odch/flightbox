import React, { PropTypes, Component } from 'react';

class AerodromeItem extends Component {

  render() {
    return (
      <div className="AerodromeItem">
        <span className="name">{this.props.item.value.name}</span>
        <span className="identification">{this.props.item.key}</span>
      </div>
    );
  }
}

AerodromeItem.propTypes = {
  item: PropTypes.object.isRequired,
};

export default AerodromeItem;
