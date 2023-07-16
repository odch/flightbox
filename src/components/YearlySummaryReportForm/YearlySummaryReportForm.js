import PropTypes from 'prop-types';
import React from 'react';
import ReportForm from '../ReportForm';
import Description from './Description';

const YearlySummaryReportForm = props => (
  <ReportForm
    disabled={props.disabled}
    date={props.date}
    delimiter={props.delimiter}
    setDate={props.setDate}
    setDelimiter={props.setDelimiter}
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
  delimiter: PropTypes.string,
  setDate: PropTypes.func.isRequired,
  setDelimiter: PropTypes.func.isRequired,
  generate: PropTypes.func.isRequired,
};

export default YearlySummaryReportForm;
