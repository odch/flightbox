import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ModalDialog from '../ModalDialog';
import MaterialIcon from '../MaterialIcon';
import './CancelConfirmationDialog.scss';

class CancelConfirmationDialog extends Component {

  render() {
    const content = (
      <div className="CancelConfirmationDialog">
        <div className="heading">Bitte bestätigen</div>
        <div className="msg">Möchten Sie wirklich abbrechen? Nicht gespeicherte Daten gehen unwiderruflich verloren.</div>
        <div className="actions">
          <button className="cancel" onClick={this.props.onCancel}>Nicht abbrechen</button>
          <button className="confirm" onClick={this.props.onConfirm}><MaterialIcon icon="done"/>&nbsp;Abbrechen und Daten verwerfen
          </button>
        </div>
      </div>
    );

    return <ModalDialog content={content} onBlur={this.props.onCancel}/>;
  }
}

CancelConfirmationDialog.propTypes = {
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,
};

export default CancelConfirmationDialog;
