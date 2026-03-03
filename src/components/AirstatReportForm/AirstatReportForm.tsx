import PropTypes from 'prop-types';
import React from 'react';
import ReportForm from '../ReportForm';
import InternalReportCheckbox from './InternalReportCheckbox';
import InternalDescription from './InternalDescription';

const AirstatReportForm = props => (
  <ReportForm
    disabled={props.disabled}
    date={props.date}
    delimiter={props.delimiter}
    setDate={props.setDate}
    setDelimiter={props.setDelimiter}
    generate={props.generate}
  >
    <InternalReportCheckbox internal={props.internal} setInternal={props.setInternal}/>
    {props.internal && <InternalDescription/>}
  </ReportForm>
);

AirstatReportForm.propTypes = {
  disabled: PropTypes.bool,
  date: PropTypes.shape({
    year: PropTypes.number,
    month: PropTypes.number,
  }),
  internal: PropTypes.bool,
  delimiter: PropTypes.string,
  setDate: PropTypes.func.isRequired,
  setInternal: PropTypes.func.isRequired,
  setDelimiter: PropTypes.func.isRequired,
  generate: PropTypes.func.isRequired,
};

export default AirstatReportForm;
