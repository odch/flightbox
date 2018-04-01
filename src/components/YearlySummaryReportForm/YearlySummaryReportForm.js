import PropTypes from 'prop-types';
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
  disabled: PropTypes.bool,
  date: PropTypes.shape({
    year: PropTypes.number,
  }),
  setDate: PropTypes.func.isRequired,
  generate: PropTypes.func.isRequired,
};

export default YearlySummaryReportForm;
