import PropTypes from 'prop-types';
import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
          <StyledLabeledComponent label={t('csvImport.selectFile')} component={fileInput}/>
          <Button
            type="submit"
            label={t('csvImport.import')}
            icon="file_upload"
            disabled={props.disabled || props.importInProgress || !props.selectedFile}
            primary
          />
          {props.importInProgress && <ProgressMessage>{t('csvImport.importing')}</ProgressMessage>}
          {props.importFailed && <FailureMessage>{t('csvImport.failed')}</FailureMessage>}
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
