import React, { PropTypes, Component } from 'react';
import ModalDialog from '../ModalDialog';
import MaterialIcon from '../MaterialIcon';
import './LocationConfirmationDialog.scss';

class LocationConfirmationDialog extends Component {

  render() {
    const content = (
      <div className="LocationConfirmationDialog">
        <div className="heading">Flugplatz-ICAO-Kürzel nicht gefunden</div>
        <div className="msg">Das von Ihnen eingegebene Flugplatz-ICAO-Kürzel wurde in der Datenbank nicht gefunden.<br/>
          Geben Sie wenn möglich das ICAO-Kürzel und nicht den ausgeschriebenen Namen des Flugplatzes ein.<br/><br/>
          <b>Lokalflüge:</b> Für Lokalflüge ohne Zwischenlandung geben Sie bitte <b>LSZT</b> ein.<br/><br/>
          Möchten Sie Ihre Eingabe ändern oder möchten Sie wirklich den eingegebenen Flugplatz verwenden?
        </div>
        <div className="actions">
          <button className="cancel" onClick={this.props.onCancel}>Flugplatz ändern</button>
          <button className="confirm" onClick={this.props.onConfirm}>
            <MaterialIcon icon="done"/>&nbsp;Eingegebenen Flugplatz verwenden
          </button>
        </div>
      </div>
    );

    return <ModalDialog content={content} onBlur={this.props.onCancel}/>;
  }
}

LocationConfirmationDialog.propTypes = {
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,
};

export default LocationConfirmationDialog;
