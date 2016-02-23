import React, { PropTypes, Component } from 'react';
import './Movement.scss';
import dates from '../../core/dates.js';

class Movement extends Component {

  actionHandler(e) {
    e.stopPropagation(); // prevent call of onClick handler
    if (typeof this.props.onAction === 'function') {
      this.props.onAction(this.props.data);
    }
  }

  deleteHandler(e) {
    e.stopPropagation(); // prevent call of onClick handler
    if (typeof this.props.onDelete === 'function') {
      this.props.onDelete(this.props.data);
    }
  }

  render() {
    const date = this.props.timeWithDate === true
      ? dates.formatDate(this.props.data.date)
      : '\u00a0';
    const time = dates.formatTime(this.props.data.date, this.props.data.time);
    return (
      <div className="Movement" onClick={this.props.onClick}>
        <div className="column immatriculation">{this.props.data.immatriculation}</div>
        <div className="column pilot">{this.props.data.lastname}</div>
        <div className="column date">{date}</div>
        <div className="column time">{time}</div>
        <div className="column location">{this.getLocation()}</div>
        <div className="column action"><span onClick={this.actionHandler.bind(this)}>{this.props.actionLabel}</span></div>
        <div className="column delete">
          <span onClick={this.deleteHandler.bind(this)}><i className="material-icons">delete</i>&nbsp;Löschen</span>
        </div>
      </div>
    );
  }

  getLocation() {
    if (this.props.data.location.toUpperCase() === 'LSZT') {
      if (this.props.data.departureRoute === 'circuits' || this.props.data.arrivalRoute === 'circuits') {
        return 'Platzrunden';
      }
      return 'Lokalflug';
    }
    return this.props.data.location;
  }
}

Movement.propTypes = {
  data: PropTypes.object,
  onClick: PropTypes.func,
  timeWithDate: PropTypes.bool,
  onAction: PropTypes.func,
  actionLabel: PropTypes.element,
  onDelete: PropTypes.func,
};

Movement.defaultProps = {
  timeWithDate: true,
};

export default Movement;
