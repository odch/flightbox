import React, { useCallback } from 'react';
import styled from 'styled-components';
import LabeledComponent from '../../components/LabeledComponent';
import Input from '../../components/Input';
import PhoneInput from '../PhoneInput';
import TextArea from '../../components/TextArea';

const StyledTextArea = styled(TextArea)`
  min-height: 8em;
  max-height: 20em;
  overflow: hidden;
`;

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
      data-cy={props.input.name}
    />
  );
  return renderLabeledComponent(props, cmp);
};

export const renderPhoneField = (props) => {
  const cmp = (
    <PhoneInput
      {...props.input}
      name={props.name}
      readOnly={props.readOnly}
      data-cy={props.input.name}
    />
  );
  return renderLabeledComponent(props, cmp);
};

const AutoGrowTextArea = (props) => {
  const handleInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
    el.style.overflow = el.scrollHeight > el.offsetHeight ? 'auto' : 'hidden';
  }, []);

  return <StyledTextArea {...props} onInput={handleInput} />;
};

export const renderTextArea = (props) => {
  const cmp = <AutoGrowTextArea {...props.input} readOnly={props.readOnly} data-cy={props.input.name}/>;
  return renderLabeledComponent(props, cmp);
};
