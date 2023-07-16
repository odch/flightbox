import React from 'react';
import styled from 'styled-components';
import LabeledComponent from '../../components/LabeledComponent';
import Input from '../../components/Input';
import IncrementationField from '../../components/IncrementationField';
import SingleSelect from '../../components/SingleSelect';
import DatePicker from '../../components/DatePicker';
import TimeField from '../../components/TimeField';
import TextArea from '../../components/TextArea';
import AerodromeDropdown from '../../containers/AerodromeDropdownContainer';
import AircraftDropdown from '../../containers/AircraftDropdownContainer';
import AircraftCategoryDropdown from '../../components/AircraftCategoryDropdown';
import UserDropdown from '../../containers/UserDropdownContainer';

const StyledLabeledComponent = styled(LabeledComponent)`
  width: 45%;
  margin-right: 5%;
  margin-bottom: 1.5em;
  display: inline-block;
  vertical-align: top;

  @media screen and (max-width: 768px) {
    width: 100%;
    margin-right: 0;
  }
`;

const renderLabeledComponent = (props, component) => {
  const { name, label, tooltip, hidden, meta: { touched, error } } = props;
  if (hidden) {
    return null
  }
  return (
    <StyledLabeledComponent
      label={label}
      className={name}
      component={component}
      validationError={touched && error ? error : null}
      tooltip={tooltip}
    />
  );
};

export const renderInputField = (props) => {
  const cmp = (
    <Input
      {...props.input}
      name={props.name}
      type={props.type}
      readOnly={props.readOnly}
      data-cy={props.input.name}
    />
  );
  return renderLabeledComponent(props, cmp);
};

export const renderSingleSelect = (props) => {
  const cmp = (
    <>
      <SingleSelect
        {...props.input}
        items={props.items}
        orientation={props.orientation}
        readOnly={props.readOnly}
        dataCy={props.input.name}
      />
      {props.hint}
    </>
  );
  return renderLabeledComponent(props, cmp);
};

export const renderIncrementationField = (props) => {
  const cmp = <IncrementationField {...props.input} readOnly={props.readOnly} dataCy={props.input.name}/>;
  return renderLabeledComponent(props, cmp);
};

export const renderDateField = (props) => {
  const cmp = <DatePicker {...props.input} readOnly={props.readOnly} dataCy={props.input.name}/>;
  return renderLabeledComponent(props, cmp);
};

export const renderTimeField = (props) => {
  const cmp = <TimeField {...props.input} readOnly={props.readOnly} dataCy={props.input.name}/>;
  return renderLabeledComponent(props, cmp);
};

export const renderDurationField = (props) => {
  const cmp = <TimeField {...props.input} readOnly={props.readOnly} dataCy={props.input.name}/>;
  return renderLabeledComponent(props, cmp);
};

export const renderTextArea = (props) => {
  const cmp = <TextArea {...props.input} readOnly={props.readOnly} data-cy={props.input.name}/>;
  return renderLabeledComponent(props, cmp);
};

export const renderAerodromeDropdown = (props) => {
  const cmp = <AerodromeDropdown {...props.input} readOnly={props.readOnly} dataCy={props.input.name}/>;
  return renderLabeledComponent(props, cmp);
};

export const renderAircraftDropdown = (props) => {
  const cmp = <AircraftDropdown {...props.input} readOnly={props.readOnly} dataCy={props.input.name}/>;
  return renderLabeledComponent(props, cmp);
};

export const renderAircraftCategoryDropdown = (props) => {
  const cmp = <AircraftCategoryDropdown {...props.input} readOnly={props.readOnly} dataCy={props.input.name}/>;
  return renderLabeledComponent(props, cmp);
};

export const renderUserDropdown = (props) => {
  const cmp = <UserDropdown {...props.input} readOnly={props.readOnly} dataCy={props.input.name}/>;
  return renderLabeledComponent(props, cmp);
};
