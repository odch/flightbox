import React from 'react';
import {connect} from 'react-redux';
import {initImport, selectImportFile, startImport} from '../modules/imports';
import UserImportForm from '../components/UserImportForm';
import {RootState} from '../modules';

const IMPORT_NAME = 'users';

class UserImportFormContainer extends React.Component<{
  initialized: boolean;
  inProgress: boolean;
  importDone: boolean;
  importFailed: boolean;
  selectedFile?: File;
  initImport: () => void;
  selectFile: (file: File) => void;
  startImport: () => void;
}> {
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

const mapStateToProps = (state: RootState) => {
  let importObj = (state.imports as any)[IMPORT_NAME];
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

const mapDispatchToProps = (dispatch: any) => ({
  initImport: () => dispatch(initImport(IMPORT_NAME)),
  selectFile: (file: File) => dispatch(selectImportFile(IMPORT_NAME, file)),
  startImport: () => dispatch(startImport(IMPORT_NAME)),
});

export default connect(mapStateToProps, mapDispatchToProps)(UserImportFormContainer);
