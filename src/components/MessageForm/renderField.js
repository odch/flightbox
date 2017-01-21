import React from 'react';
import styled from 'styled-components';
import LabeledComponent from '../../components/LabeledComponent';
import Input from '../../components/Input';
import TextArea from '../../components/TextArea';

const StyledLabeledComponent = styled(LabeledComponent)`
  margin-bottom: 1.8em;
  margin-right: 5%;
`;

const renderLabeledComponent = (props, component) => {
  const { name, label, tooltip, meta: { touched, error } } = props;
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
    />
  );
  return renderLabeledComponent(props, cmp);
};

export const renderTextArea = (props) => {
  const cmp = <TextArea {...props.input} readOnly={props.readOnly}/>;
  return renderLabeledComponent(props, cmp);
};
