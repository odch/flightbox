import React, { PropTypes, Component } from 'react';
import './Movement.scss';

class Movement extends Component {

  render() {
    const destination = this.props.data.departureArrival.destination === 'LSZT'
      ? 'Lokalflug'
      : this.props.data.departureArrival.destination;
    return (
      <div className="Movement" onClick={this.props.onClick}>
        <div className="column immatriculation">{this.props.data.aircraft.immatriculation}</div>
        <div className="column pilot">{this.props.data.pilot.lastname}</div>
        <div className="column start-time">{this.props.data.departureArrival.startTime}</div>
        <div className="column destination">{destination}</div>
      </div>
    );
  }
}

Movement.propTypes = {
  data: PropTypes.object,
  onClick: PropTypes.func,
};

export default Movement;
