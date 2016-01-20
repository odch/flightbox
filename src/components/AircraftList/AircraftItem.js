import React, { PropTypes, Component } from 'react';

class AircraftItem extends Component {

  render() {
    return (
      <div className="AircraftItem">
        <span className="immatriculation">{this.props.item.key}</span>
        <span className="type">{this.props.item.value.type}</span>
      </div>
    );
  }
}

AircraftItem.propTypes = {
  item: PropTypes.object.isRequired,
};

export default AircraftItem;
