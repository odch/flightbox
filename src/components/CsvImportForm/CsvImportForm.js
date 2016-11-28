import React, { PropTypes } from 'react';
import LabeledComponent from '../LabeledComponent';
import FileInput from '../FileInput';
import ImportDoneDialog from './ImportDoneDialog';
import './CsvImportForm.scss';

const handleFormSubmit = (startImport, e) => {
  e.preventDefault();
  startImport();
};

const CsvImportForm = props => {
  const importDoneDialog = props.importDone === true
    ? (
      <ImportDoneDialog
        doneHeading={props.doneHeading}
        doneMessage={props.doneMessage}
        onClose={props.closeDoneDialog}
      />
    ) : null;

  const fileInput = (
    <FileInput
      value={props.selectedFile}
      onChange={e => props.selectFile(e.target.value)}
      disabled={props.disabled || props.importInProgress}
    />
  );

  return (
    <div className="CsvImportForm">
      <div>
        {props.description}
        <form onSubmit={handleFormSubmit.bind(null, props.startImport)}>
          <LabeledComponent label="CSV-Datei auswählen" component={fileInput}/>
          <button type="submit" className="import" disabled={props.disabled || props.importInProgress || !props.selectedFile}>
            <i className="material-icons">file_upload</i>&nbsp;Importieren
          </button>
          {props.importInProgress && (
            <span className="import-in-progress-msg">Import wird ausgeführt. Bitte warten ...</span>
          )}
        </form>
      </div>
      {importDoneDialog}
    </div>
  );
};

CsvImportForm.propTypes = {
  disabled: PropTypes.bool,
  importInProgress: PropTypes.bool.isRequired,
  importDone: PropTypes.bool.isRequired,
  selectedFile: PropTypes.object,
  description: PropTypes.element.isRequired,
  doneHeading: PropTypes.string.isRequired,
  doneMessage: PropTypes.string.isRequired,
  selectFile: PropTypes.func.isRequired,
  startImport: PropTypes.func.isRequired,
  closeDoneDialog: PropTypes.func.isRequired,
};

export default CsvImportForm;
