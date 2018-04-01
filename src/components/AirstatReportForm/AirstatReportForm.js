import PropTypes from 'prop-types';
import React from 'react';
import ReportForm from '../ReportForm';
import InternalReportCheckbox from './InternalReportCheckbox';
import InternalDescription from './InternalDescription';

const AirstatReportForm = props => (
  <ReportForm
    disabled={props.disabled}
    date={props.date}
    setDate={props.setDate}
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
  setDate: PropTypes.func.isRequired,
  setInternal: PropTypes.func.isRequired,
  generate: PropTypes.func.isRequired,
};

export default AirstatReportForm;
