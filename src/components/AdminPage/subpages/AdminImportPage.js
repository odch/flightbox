import React from 'react';
import LabeledBox from '../../LabeledBox';
import UserImportForm from '../../../containers/UserImportFormContainer';
import { useTranslation } from 'react-i18next';

const AdminImportPage = () => {
  const { t } = useTranslation();
  return (
    <>
      <LabeledBox label={t('adminImport.userList')} className="user-import">
        <UserImportForm/>
      </LabeledBox>
    </>
  );
};

export default AdminImportPage;
