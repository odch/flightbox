import React, { PropTypes, Component } from 'react';
import ModalDialog from '../../ModalDialog';
import './CommitRequirementsDialog.scss';

class CommitRequirementsDialog extends Component {

  render() {
    const content = (
      <div className="CommitRequirementsDialog">
        <div className="heading">Bitte bestätigen</div>
        <ul className="items">
          <li>Meine Ausweise sind gültig.</li>
          <li>Das maximale Abfluggewicht und der Schwerpunkt sind innerhalb der zulässigen Limiten.</li>
          <li>Die verfügbare Pistenlänge ist ausreichend.</li>
          <li>Bei Passagierflügen: Ich habe in den letzten 90 Tagen mindestens 3 Landungen absolviert.</li>
          <li>Der Preflight-Check wurde ausgeführt.</li>
        </ul>
        <div className="actions">
          <button className="cancel" onClick={this.props.onCancel}>Abbrechen</button>
          <button className="confirm" onClick={this.props.onConfirm}><i className="material-icons">done_all</i>&nbsp;Bestätigen
          </button>
        </div>
      </div>
    );

    return <ModalDialog content={content} onBlur={this.props.onCancel}/>;
  }
}

CommitRequirementsDialog.propTypes = {
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,
};

export default CommitRequirementsDialog;
