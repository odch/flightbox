import React from 'react';
import LabeledBox from '../../LabeledBox';
import UserImportForm from '../../../containers/UserImportFormContainer';

const AdminImportPage = () => {
  return (
    <>
      <LabeledBox label="Benutzerliste importieren" className="user-import">
        <UserImportForm/>
      </LabeledBox>
    </>
  );
};

export default AdminImportPage;
