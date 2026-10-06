import React from 'react';
import LabeledBox from '../../LabeledBox';
import DescriptionText from '../DescriptionText';
import CustomsSyncStatus from '../../../containers/CustomsSyncStatusContainer';
import CustomsSelfDeclarationEmailList from '../../../containers/CustomsSelfDeclarationEmailListContainer';
import { useTranslation } from 'react-i18next';

const AdminCustomsSelfDeclarationPage = () => {
  const { t } = useTranslation();
  return (
    <LabeledBox label={t('adminCustomsSelfDeclaration.title')}>
      <DescriptionText>
        {t('adminCustomsSelfDeclaration.description')}
      </DescriptionText>
      <CustomsSyncStatus statusKey="selfDeclarationEmails"/>
      <CustomsSelfDeclarationEmailList/>
    </LabeledBox>
  );
};

export default AdminCustomsSelfDeclarationPage;
