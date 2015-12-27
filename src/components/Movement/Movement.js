import React, { PropTypes, Component } from 'react';
import './Movement.scss';

class Movement extends Component {

  render() {
    const destination = this.props.data.destination === 'LSZT'
      ? 'Lokalflug'
      : this.props.data.destination;
    return (
      <div className="Movement" onClick={this.props.onClick}>
        <div className="column immatriculation">{this.props.data.immatriculation}</div>
        <div className="column pilot">{this.props.data.lastname}</div>
        <div className="column start-time">{this.props.data.time}</div>
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
