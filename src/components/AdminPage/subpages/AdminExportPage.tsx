import React from 'react';
import LabeledBox from '../../LabeledBox';
import AirstatReportForm from '../../../containers/AirstatReportFormContainer';
import LandingsReportForm from '../../../containers/LandingsReportFormContainer';
import InvoicesReportForm from '../../../containers/InvoicesReportFormContainer';
import YearlySummaryReportForm from '../../../containers/YearlySummaryReportFormContainer';
import objectToArray from '../../../util/objectToArray';
import { useTranslation } from 'react-i18next';

const AdminExportPage = () => {
  const { t } = useTranslation();
  const invoicePaymentEnabled = objectToArray(__CONF__.paymentMethods).includes('invoice');

  return (
    <>
      <LabeledBox label={t('adminExport.bazlReport')} className="AirstatReportForm">
        <AirstatReportForm/>
      </LabeledBox>
      <LabeledBox label={t('adminExport.landingList')}>
        <LandingsReportForm/>
      </LabeledBox>
      {invoicePaymentEnabled && (
        <LabeledBox label={t('adminExport.invoiceReports')}>
          <InvoicesReportForm/>
        </LabeledBox>
      )}
      <LabeledBox label={t('adminExport.yearlySummary')}>
        <YearlySummaryReportForm/>
      </LabeledBox>
    </>
  );
};

export default AdminExportPage;
