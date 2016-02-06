import React, { PropTypes, Component } from 'react';
import './MovementDeleteConfirmationDialog.scss';
import dates from '../../core/dates.js';

class MovementDeleteConfirmationDialog extends Component {

  cancelHandler() {
    if (typeof this.props.onCancel === 'function') {
      this.props.onCancel(this.props.item);
    }
  }

  confirmHandler() {
    if (typeof this.props.onConfirm === 'function') {
      this.props.onConfirm(this.props.item);
    }
  }

  render() {
    const date = dates.formatDate(this.props.item.date);
    const time = dates.formatTime(this.props.item.date, this.props.item.time);

    return (
      <div className="MovementDeleteConfirmationDialog">
        <div className="mask" onClick={this.props.onCancel}></div>
        <div className="content">
          <div className="question">Möchten Sie diese Bewegung wirklich löschen?</div>
          <div className="data">
            <div>Immatrikulation: {this.props.item.immatriculation}</div>
            <div>Pilot: {this.props.item.lastname}</div>
            <div>Datum: {date}</div>
            <div>Uhrzeit: {time}</div>
          </div>
          <div className="actions">
            <button className="cancel" onClick={this.cancelHandler.bind(this)}>Abbrechen</button>
            <button className="confirm" onClick={this.confirmHandler.bind(this)}><i className="material-icons">delete</i>&nbsp;Bewegung löschen</button>
          </div>
        </div>
      </div>
    );
  }
}

MovementDeleteConfirmationDialog.propTypes = {
  item: PropTypes.object,
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,
};

export default MovementDeleteConfirmationDialog;
