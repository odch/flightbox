import React from 'react';
import LabeledComponent from '../LabeledComponent';
import { MonthPicker } from '../DatePicker';
import './ReportForm.scss';

const handleSubmit = (generate, date, parameters, e) => {
  e.preventDefault();
  generate(date, parameters);
};

const ReportForm = props => {
  const monthPicker = (
    <MonthPicker
      value={props.date}
      onChange={(e) => props.setDate(e.value)}
    />
  );

  return (
    <form
      className="ReportForm"
      onSubmit={handleSubmit.bind(null, props.generate, props.date, props.parameters)}
    >
      <fieldset disabled={props.disabled}>
        <div>
          <LabeledComponent label="Monat" component={monthPicker}/>
        </div>
        {props.children}
        <button type="submit" className="generate">
          <i className="material-icons">file_download</i>&nbsp;Herunterladen
        </button>
      </fieldset>
    </form>
  );
};

ReportForm.propTypes = {
  disabled: React.PropTypes.bool,
  children: React.PropTypes.node,
  date: React.PropTypes.string,
  parameters: React.PropTypes.object,
  setDate: React.PropTypes.func.isRequired,
  generate: React.PropTypes.func.isRequired,
};

export default ReportForm;
