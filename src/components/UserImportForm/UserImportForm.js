import React, { Component } from 'react';
import LabeledComponent from '../LabeledComponent';
import ModalDialog from '../ModalDialog';
import importUsers from '../../util/user-import.js';
import './UserImportForm.scss';

class UserImportForm extends Component {

  constructor(props) {
    super(props);
    this.state = {
      importInProgress: false,
      selectedFile: null,
      importDone: false,
    };
  }

  render() {
    const importDoneDialog = this.getImportDoneDialog();

    const fileInput = <input type="file" ref="fileInput" onChange={this.fileChangeHandler.bind(this)}/>;

    return (
      <div className="UserImportForm">
        <div>
          <div>
            <p>Für den Import wird eine CSV-Datei benötigt, der alle Benutzer enthält. Beim Import werden
              alle Benuter aus der Datenbank entfernt, die nicht in der CSV-Datei enthalten sind.</p>
            <p>
              Die Datei muss aus den Spalten <em>UserName</em>, <em>LastName</em>, <em>FirstName</em> und <em>PhoneMobile</em> bestehen.
              Die Sortierung ist nicht relevant.
              Die CSV-Datei muss als <strong>UTF-8</strong>-Datei gespeichert sein.
            </p>
            <p>Muster mit zwei Personen:</p>
            <pre className="example">
              UserName,LastName,FirstName,PhoneMobile<br/>
              11069,Mustermann,Max,+41791234567<br/>
              11293,Musterfrau,Maria,+41768765432<br/>
            </pre>
          </div>
          <form ref="form">
            <LabeledComponent label="CSV-Datei auswählen" component={fileInput}/>
          </form>
        </div>
        <button
          onClick={this.buttonClickHandler.bind(this)}
          className="import"
          disabled={this.state.importInProgress || !this.state.selectedFile}
        >
          <i className="material-icons">file_upload</i>&nbsp;Importieren
        </button>
        {importDoneDialog}
      </div>
    );
  }

  fileChangeHandler(e) {
    const files = e.target.files;

    let selectedFile = null;

    if (files.length > 0) {
      selectedFile = files[0];
    }

    this.setState({
      selectedFile,
    });
  }

  buttonClickHandler() {
    this.setState({
      importInProgress: true,
    });
    this.getAsText(this.refs.fileInput.files[0], event => {
      importUsers(event.target.result, () => {
        this.setState({
          importInProgress: false,
          importDone: true,
        });
      });
    });
  }

  getAsText(fileToRead, onload, onerror) {
    const reader = new FileReader();
    reader.onload = onload;
    reader.onerror = onerror;
    reader.readAsText(fileToRead);
  }

  getImportDoneDialog() {
    if (this.state.importDone === true) {
      const content = (
        <div>
          <div className="heading">Benutzer importiert</div>
          <div className="message">Die Benutzer wurden importiert.</div>
          <button className="close" onClick={this.closeImportDoneDialogHandler.bind(this)}><i
            className="material-icons">close</i>&nbsp;Schliessen
          </button>
        </div>
      );
      return (
        <ModalDialog
          content={content}
          onBlur={this.closeImportDoneDialogHandler.bind(this)}
        />
      );
    }
    return null;
  }

  closeImportDoneDialogHandler() {
    this.refs.form.reset();
    this.setState({
      importInProgress: false,
      importDone: false,
      selectedFile: null,
    });
  }
}

export default UserImportForm;
