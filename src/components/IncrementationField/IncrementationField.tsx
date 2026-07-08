import React, { useState } from 'react';
import Button from './Button';
import Value from './Value';
import Input from './Input';

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

  const [editingValue, setEditingValue] = useState<string | null>(null);

  const change = (newValue: number) => {
    if (newValue < minValue) newValue = minValue;
    if (typeof onChange === 'function') {
      onChange({ target: { value: newValue } });
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
    setEditingValue(e.target.value);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (/^\d*$/.test(e.target.value)) {
      setEditingValue(e.target.value);
    }
  };

  const handleBlur = () => {
    const parsed = /^\d+$/.test(editingValue ?? '')
      ? parseInt(editingValue as string, 10)
      : minValue;
    setEditingValue(null);
    change(parsed);
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
      <Input
        type="text"
        inputMode="numeric"
        value={editingValue !== null ? editingValue : String(value)}
        onFocus={handleFocus}
        onChange={handleChange}
        onBlur={handleBlur}
        data-cy={`${dataCy}-input`}
      />
      <Button type="button" onClick={() => change(value + 1)} data-cy={`${dataCy}-increment`}>+</Button>
    </div>
  );
};

export default IncrementationField;
