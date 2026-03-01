import React from 'react';
import LabeledBox from '../../LabeledBox';
import AerodromeStatusForm from '../../../containers/AerodromeStatusFormContainer';
import { useTranslation } from 'react-i18next';

const AdminAerodromeStatusPage = () => {
  const { t } = useTranslation();
  return (
    <LabeledBox label={t('admin.aerodromeStatus')} contentPadding={0}>
      <AerodromeStatusForm/>
    </LabeledBox>
  );
};

export default AdminAerodromeStatusPage;
