import React, { useEffect } from 'react';
import {connect} from 'react-redux';
import {generateReport, initReport, setReportDate, setReportParameter} from '../modules/reports';
import ReportForm from '../components/ReportForm';
import {RootState} from '../modules';

interface ReportDate {
  year?: number;
  month?: number;
}

interface Props {
  initialized: boolean;
  date?: ReportDate;
  format?: string;
  generationInProgress?: boolean;
  initReport: () => void;
  setDate: (date: ReportDate) => void;
  setFormat: (format: string) => void;
  generate: () => void;
}

const InvoicesReportFormContainer = (props: Props) => {
  useEffect(() => {
    props.initReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ReportForm
      disabled={!props.initialized || props.generationInProgress}
      date={props.date}
      format={props.format}
      setDate={props.setDate}
      setFormat={props.setFormat}
      generate={props.generate}
      withDelimiter={false}
      withFormat
    />
  );
};

const mapStateToProps = (state: RootState) => {
  let report = (state.reports as any).invoices;
  let initialized = true;

  if (!report) {
    report = {parameters: {}};
    initialized = false;
  }

  return {
    initialized,
    date: report.date,
    format: report.parameters.format || 'pdf',
    generationInProgress: report.generationInProgress === true,
  };
};

const mapDispatchToProps = (dispatch: any) => ({
  initReport: () => dispatch(initReport('invoices')),
  setDate: (date: any) => dispatch(setReportDate('invoices', date)),
  setFormat: (format: string) =>
    dispatch(setReportParameter('invoices', 'format', format)),
  generate: () => dispatch(generateReport('invoices')),
});

export default connect(mapStateToProps, mapDispatchToProps)(InvoicesReportFormContainer);
