import React, { PropTypes, Component } from 'react';
import './MovementDeleteConfirmationDialog.scss';
import ModalDialog from '../ModalDialog';
import MaterialIcon from '../MaterialIcon';
import dates from '../../util/dates';

class MovementDeleteConfirmationDialog extends Component {

  render() {
    const { item, hide, confirm } = this.props;

    const date = dates.formatDate(item.date);
    const time = dates.formatTime(item.date, item.time);

    const content = (
      <div className="MovementDeleteConfirmationDialog">
        <div className="question">Möchten Sie diese Bewegung wirklich löschen?</div>
        <div className="data">
          <div>Immatrikulation: {item.immatriculation}</div>
          <div>Pilot: {item.lastname}</div>
          <div>Datum: {date}</div>
          <div>Uhrzeit: {time}</div>
        </div>
        <div className="actions">
          <button className="cancel" onClick={hide}>Abbrechen</button>
          <button className="confirm" onClick={() => { confirm(item.key, hide); }}>
            <MaterialIcon icon="delete"/>&nbsp;Bewegung löschen
          </button>
        </div>
      </div>
    );
    return <ModalDialog content={content} onBlur={hide}/>;
  }
}

MovementDeleteConfirmationDialog.propTypes = {
  item: PropTypes.object.isRequired,
  confirm: PropTypes.func.isRequired,
  hide: PropTypes.func.isRequired,
};

export default MovementDeleteConfirmationDialog;
