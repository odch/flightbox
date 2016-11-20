import React from 'react';
import LabeledComponent from '../components/LabeledComponent';
import Input from '../components/Input';
import IncrementationField from '../components/IncrementationField';
import SingleSelect from '../components/SingleSelect';
import DatePicker from '../components/DatePicker';
import TimeField from '../components/TimeField';
import TextArea from '../components/TextArea';
import AerodromeDropdown from '../containers/AerodromeDropdownContainer';
import AircraftDropdown from '../containers/AircraftDropdownContainer';
import UserDropdown from '../containers/UserDropdownContainer';

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
  const cmp = <Input {...props.input} name={props.name} type={props.type}/>;
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
  const cmp = <TextArea {...props.input}/>;
  return renderLabeledComponent(props, cmp);
};

export const renderAerodromeDropdown = (props) => {
  const cmp = <AerodromeDropdown {...props.input}/>;
  return renderLabeledComponent(props, cmp);
};

export const renderAircraftDropdown = (props) => {
  const cmp = <AircraftDropdown {...props.input}/>;
  return renderLabeledComponent(props, cmp);
};

export const renderUserDropdown = (props) => {
  const cmp = <UserDropdown {...props.input}/>;
  return renderLabeledComponent(props, cmp);
};
