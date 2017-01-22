import React from 'react';
import Button from '../Button';
import LabeledMonthPicker from './LabeledMonthPicker';

const handleSubmit = (generate, date, parameters, e) => {
  e.preventDefault();
  generate(date, parameters);
};

const ReportForm = props => {
  return (
    <form
      className="ReportForm"
      onSubmit={handleSubmit.bind(null, props.generate, props.date, props.parameters)}
    >
      <fieldset disabled={props.disabled}>
        <LabeledMonthPicker date={props.date} setDate={props.setDate}/>
        {props.children}
        <Button type="submit" label="Herunterladen" icon="file_download" primary/>
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
