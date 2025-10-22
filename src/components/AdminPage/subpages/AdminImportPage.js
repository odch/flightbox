import React from 'react';
import LabeledBox from '../../LabeledBox';
import UserImportForm from '../../../containers/UserImportFormContainer';
import AircraftImportForm from '../../../containers/AircraftImportFormContainer';

const AdminImportPage = () => {
  return (
    <>
      <LabeledBox label="Benutzerliste importieren" className="user-import">
        <UserImportForm/>
      </LabeledBox>
      <LabeledBox label="Flugzeugliste importieren" className="aircraft-import">
        <AircraftImportForm/>
      </LabeledBox>
    </>
  );
};

export default AdminImportPage;
