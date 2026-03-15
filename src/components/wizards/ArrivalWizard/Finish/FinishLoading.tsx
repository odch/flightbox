import React from 'react';
import Centered from '../../../Centered';
import { useTranslation } from 'react-i18next';

const FinishLoading = () => {
  const { t } = useTranslation();
  return <Centered>{t('common.loading')}</Centered>;
};

export default FinishLoading;
