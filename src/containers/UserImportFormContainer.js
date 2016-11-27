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
        disabled={!this.props.initialized || this.props.inProgress}
        selectedFile={this.props.selectedFile}
        importDone={this.props.importDone}
        selectFile={this.props.selectFile}
        startImport={this.props.startImport}
        closeDoneDialog={this.props.initImport}
      />
    );
  }
}

UserImportFormContainer.propTypes = {
  initialized: React.PropTypes.bool.isRequired,
  inProgress: React.PropTypes.bool.isRequired,
  importDone: React.PropTypes.bool.isRequired,
  selectedFile: React.PropTypes.object,
  initImport: React.PropTypes.func.isRequired,
  selectFile: React.PropTypes.func.isRequired,
  startImport: React.PropTypes.func.isRequired,
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
