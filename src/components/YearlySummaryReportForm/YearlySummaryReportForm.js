import React from 'react';
import ReportForm from '../ReportForm';
import Description from './Description';

const YearlySummaryReportForm = props => (
  <ReportForm
    disabled={props.disabled}
    date={props.date}
    setDate={props.setDate}
    generate={props.generate}
    withMonth={false}
  >
    <Description/>
  </ReportForm>
);

YearlySummaryReportForm.propTypes = {
  disabled: React.PropTypes.bool,
  date: React.PropTypes.shape({
    year: React.PropTypes.number,
  }),
  setDate: React.PropTypes.func.isRequired,
  generate: React.PropTypes.func.isRequired,
};

export default YearlySummaryReportForm;
