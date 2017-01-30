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
  disabled: React.PropTypes.bool,
  date: React.PropTypes.shape({
    year: React.PropTypes.number,
    month: React.PropTypes.number,
  }),
  internal: React.PropTypes.bool,
  setDate: React.PropTypes.func.isRequired,
  setInternal: React.PropTypes.func.isRequired,
  generate: React.PropTypes.func.isRequired,
};

export default AirstatReportForm;
