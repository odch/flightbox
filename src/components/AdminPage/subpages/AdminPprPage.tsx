import React from 'react';
import LabeledBox from '../../LabeledBox';
import PprRequestList from '../../../containers/PprRequestListContainer';
import { useTranslation } from 'react-i18next';

const AdminPprPage = () => {
  const { t } = useTranslation();
  return (
    <LabeledBox label={t('admin.ppr')} className="ppr" contentPadding={0}>
      <PprRequestList/>
    </LabeledBox>
  );
};

export default AdminPprPage;
