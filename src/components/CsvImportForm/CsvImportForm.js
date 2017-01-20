import React, { PropTypes } from 'react';
import FileInput from '../FileInput';
import Button from '../Button';
import ImportDoneDialog from './ImportDoneDialog';
import FailureMessage from './FailureMessage';
import ProgressMessage from './ProgressMessage';
import StyledLabeledComponent from './StyledLabeledComponent';

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
          <StyledLabeledComponent label="CSV-Datei auswählen" component={fileInput}/>
          <Button
            type="submit"
            label="Importieren"
            icon="file_upload"
            disabled={props.disabled || props.importInProgress || !props.selectedFile}
          />
          {props.importInProgress && <ProgressMessage>Import wird ausgeführt. Bitte warten ...</ProgressMessage>}
          {props.importFailed && <FailureMessage>Der Import ist fehlgeschlagen.</FailureMessage>}
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
  importFailed: PropTypes.bool.isRequired,
  selectedFile: PropTypes.object,
  description: PropTypes.element.isRequired,
  doneHeading: PropTypes.string.isRequired,
  doneMessage: PropTypes.string.isRequired,
  selectFile: PropTypes.func.isRequired,
  startImport: PropTypes.func.isRequired,
  closeDoneDialog: PropTypes.func.isRequired,
};

export default CsvImportForm;
