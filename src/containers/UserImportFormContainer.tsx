import React, { useEffect } from 'react';
import {connect} from 'react-redux';
import {initImport, selectImportFile, startImport} from '../modules/imports';
import UserImportForm from '../components/UserImportForm';
import {RootState} from '../modules';

const IMPORT_NAME = 'users';

interface Props {
  initialized: boolean;
  inProgress: boolean;
  importDone: boolean;
  importFailed: boolean;
  selectedFile?: File;
  initImport: () => void;
  selectFile: (file: File) => void;
  startImport: () => void;
}

const UserImportFormContainer = (props: Props) => {
  useEffect(() => {
    props.initImport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <UserImportForm
      disabled={!props.initialized}
      selectedFile={props.selectedFile}
      importInProgress={props.inProgress}
      importDone={props.importDone}
      importFailed={props.importFailed}
      selectFile={props.selectFile}
      startImport={props.startImport}
      closeDoneDialog={props.initImport}
    />
  );
};

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
