import React, { PropTypes, Component } from 'react';

class AirportItem extends Component {

  render() {
    return (
      <div className="AirportItem">
        <span className="name">{this.props.item.value.name}</span>
        <span className="identification">{this.props.item.key}</span>
      </div>
    );
  }
}

AirportItem.propTypes = {
  item: PropTypes.object.isRequired,
};

export default AirportItem;
