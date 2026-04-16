import React from 'react';
import Button from './Button';
import Value from './Value';

interface IncrementationFieldProps {
  value?: number;
  minValue?: number;
  onChange?: (event: { target: { value: number } }) => void;
  readOnly?: boolean;
  dataCy?: string;
}

const IncrementationField: React.FC<IncrementationFieldProps> = ({
  value: valueProp,
  minValue = 0,
  onChange,
  readOnly,
  dataCy,
}) => {
  const value = typeof valueProp === 'undefined' ? minValue : valueProp;

  const change = (newValue: number) => {
    if (newValue < minValue) newValue = minValue;
    if (typeof onChange === 'function') {
      onChange({ target: { value: newValue } });
    }
  };

  if (readOnly === true) {
    return (
      <div>
        <Value>{value}</Value>
      </div>
    );
  }

  return (
    <div>
      <Button type="button" onClick={() => change(value - 1)} data-cy={`${dataCy}-decrement`}>-</Button>
      <Value>{value}</Value>
      <Button type="button" onClick={() => change(value + 1)} data-cy={`${dataCy}-increment`}>+</Button>
    </div>
  );
};

export default IncrementationField;
