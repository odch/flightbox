import React, { PropTypes, Component } from 'react';
import './Movement.scss';
import dates from '../../core/dates.js';

class Movement extends Component {

  render() {
    const date = this.props.timeWithDate === true
      ? dates.formatDate(this.props.data.date)
      : '\u00a0';
    const time = dates.formatTime(this.props.data.date, this.props.data.time);
    const location = this.props.data.location === 'LSZT'
      ? 'Lokalflug'
      : this.props.data.location;
    return (
      <div className="Movement" onClick={this.props.onClick}>
        <div className="column immatriculation">{this.props.data.immatriculation}</div>
        <div className="column pilot">{this.props.data.lastname}</div>
        <div className="column date">{date}</div>
        <div className="column time">{time}</div>
        <div className="column location">{location}</div>
      </div>
    );
  }
}

Movement.propTypes = {
  data: PropTypes.object,
  onClick: PropTypes.func,
  timeWithDate: PropTypes.bool,
};

Movement.defaultProps = {
  timeWithDate: true,
};

export default Movement;
