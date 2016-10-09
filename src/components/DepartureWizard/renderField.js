import React from 'react';
import LabeledComponent from '../LabeledComponent';
import IncrementationField from '../IncrementationField';
import SingleSelect from '../SingleSelect';
import DatePicker from '../DatePicker';
import TimeField from '../TimeField';

const renderLabeledComponent = (props, component) => {
  const { name, label, tooltip, meta: { touched, error } } = props;
  return (
    <LabeledComponent
      label={label}
      className={name}
      component={component}
      validationError={touched && error ? error : null}
      tooltip={tooltip}
    />
  );
};

export const renderInputField = (props) => {
  const cmp = <input {...props.input} name={props.name} type={props.type}/>;
  return renderLabeledComponent(props, cmp);
};

export const renderSingleSelect = (props) => {
  const cmp = <SingleSelect {...props.input} items={props.items} orientation={props.orientation}/>;
  return renderLabeledComponent(props, cmp);
};

export const renderIncrementationField = (props) => {
  const cmp = <IncrementationField {...props.input}/>;
  return renderLabeledComponent(props, cmp);
};

export const renderDateField = (props) => {
  const cmp = <DatePicker {...props.input}/>;
  return renderLabeledComponent(props, cmp);
};

export const renderTimeField = (props) => {
  const cmp = <TimeField {...props.input}/>;
  return renderLabeledComponent(props, cmp);
};

export const renderDurationField = (props) => {
  const cmp = <TimeField {...props.input}/>;
  return renderLabeledComponent(props, cmp);
};

export const renderTextArea = (props) => {
  const cmp = <textarea {...props.input}/>;
  return renderLabeledComponent(props, cmp);
};
