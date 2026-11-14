import React from 'react';
import { useSearchParams } from 'react-router-dom';
import LabeledBox from '../../LabeledBox';
import PprRequestList from '../../../containers/PprRequestListContainer';
import PprSettingsForm from '../../../containers/PprSettingsFormContainer';
import { useTranslation } from 'react-i18next';

const AdminPprPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  // The request a link in the notification email opens
  // (#/admin?tab=ppr&request=<key>)
  const linkedKey = searchParams.get('request');
  return (
    <>
      <LabeledBox label={t('ppr.settings.title')} className="ppr-settings">
        <PprSettingsForm/>
      </LabeledBox>
      <LabeledBox label={t('admin.ppr')} className="ppr" contentPadding={0}>
        {/* One list per link: the list opens the linked request after a
            load of its own, so a link opened in a tab that already shows
            the list also finds a request submitted since */}
        <PprRequestList key={linkedKey} linkedKey={linkedKey}/>
      </LabeledBox>
    </>
  );
};

export default AdminPprPage;
