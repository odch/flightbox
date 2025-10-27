import React from 'react';
import LabeledBox from '../../LabeledBox';
import AerodromeStatusForm from '../../../containers/AerodromeStatusFormContainer';

const AdminAerodromeStatusPage = () => {
  return (
    <LabeledBox label="Flugplatz-Status" contentPadding={0}>
      <AerodromeStatusForm/>
    </LabeledBox>
  );
};

export default AdminAerodromeStatusPage;
