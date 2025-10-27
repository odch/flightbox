import React from 'react';
import LabeledBox from '../../LabeledBox';
import AirstatReportForm from '../../../containers/AirstatReportFormContainer';
import LandingsReportForm from '../../../containers/LandingsReportFormContainer';
import InvoicesReportForm from '../../../containers/InvoicesReportFormContainer';
import YearlySummaryReportForm from '../../../containers/YearlySummaryReportFormContainer';
import objectToArray from '../../../util/objectToArray';

const AdminExportPage = () => {
  const invoicePaymentEnabled = objectToArray(__CONF__.paymentMethods).includes('invoice');

  return (
    <>
      <LabeledBox label="BAZL-Report herunterladen (CSV)" className="AirstatReportForm">
        <AirstatReportForm/>
      </LabeledBox>
      <LabeledBox label="Landeliste herunterladen (CSV)">
        <LandingsReportForm/>
      </LabeledBox>
      {invoicePaymentEnabled && (
        <LabeledBox label="Rechnungsberichte herunterladen (PDF)">
          <InvoicesReportForm/>
        </LabeledBox>
      )}
      <LabeledBox label="Jahreszusammenfassung herunterladen (CSV)">
        <YearlySummaryReportForm/>
      </LabeledBox>
    </>
  );
};

export default AdminExportPage;
