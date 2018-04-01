import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { initImport, selectImportFile, startImport } from '../modules/imports';
import UserImportForm from '../components/UserImportForm';

const IMPORT_NAME = 'users';

class UserImportFormContainer extends React.Component {

  componentWillMount() {
    this.props.initImport();
  }

  render() {
    return (
      <UserImportForm
        disabled={!this.props.initialized}
        selectedFile={this.props.selectedFile}
        importInProgress={this.props.inProgress}
        importDone={this.props.importDone}
        importFailed={this.props.importFailed}
        selectFile={this.props.selectFile}
        startImport={this.props.startImport}
        closeDoneDialog={this.props.initImport}
      />
    );
  }
}

UserImportFormContainer.propTypes = {
  initialized: PropTypes.bool.isRequired,
  inProgress: PropTypes.bool.isRequired,
  importDone: PropTypes.bool.isRequired,
  importFailed: PropTypes.bool.isRequired,
  selectedFile: PropTypes.object,
  initImport: PropTypes.func.isRequired,
  selectFile: PropTypes.func.isRequired,
  startImport: PropTypes.func.isRequired,
};

const mapStateToProps = state => {
  let importObj = state.imports[IMPORT_NAME];
  let initialized = true;

  if (!importObj) {
    importObj = {};
    initialized = false;
  }

  return {
    initialized,
    selectedFile: importObj.file,
    inProgress: importObj.inProgress === true,
    importDone: importObj.done === true,
    importFailed: importObj.failed === true,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    initImport: () => dispatch(initImport(IMPORT_NAME)),
    selectFile: file => dispatch(selectImportFile(IMPORT_NAME, file)),
    startImport: () => dispatch(startImport(IMPORT_NAME)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(UserImportFormContainer);
