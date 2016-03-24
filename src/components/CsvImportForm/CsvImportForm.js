import React, { Component, PropTypes } from 'react';
import LabeledComponent from '../LabeledComponent';
import ModalDialog from '../ModalDialog';
import './CsvImportForm.scss';

class CsvImportForm extends Component {

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
      <div className="CsvImportForm">
        <div>
          {this.props.description}
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
      this.props.importFunc(event.target.result, () => {
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
          <div className="heading">{this.props.doneHeading}</div>
          <div className="message">{this.props.doneMessage}</div>
          <button className="close" onClick={this.closeImportDoneDialogHandler.bind(this)}>
            <i className="material-icons">close</i>&nbsp;Schliessen
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

CsvImportForm.propTypes = {
  description: PropTypes.element.isRequired,
  doneHeading: PropTypes.string.isRequired,
  doneMessage: PropTypes.string.isRequired,
  importFunc: PropTypes.func.isRequired,
};

export default CsvImportForm;
