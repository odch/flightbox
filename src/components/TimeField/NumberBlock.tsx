import PropTypes from 'prop-types';
import React, { useState } from 'react';
import NumberBlockWrapper from './NumberBlockWrapper';
import Button from './Button';
import Input from './Input';

const formatTwoDigit = (number: number) => ('0' + number).slice(-2);

const NumberBlock = (props: any) => {
  const [editingValue, setEditingValue] = useState<string | null>(null);

  const execWhilePressed = (element: HTMLElement, func: () => void) => {
    func();

    const interval = window.setInterval(func, 150);

    const clearFunc = () => {
      window.clearInterval(interval);
    };

    element.addEventListener('mouseup', clearFunc);
    element.addEventListener('mouseout', clearFunc);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
    setEditingValue(e.target.value);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (/^\d{0,2}$/.test(e.target.value)) {
      setEditingValue(e.target.value);
    }
  };

  const handleBlur = () => {
    const value = /^\d{1,2}$/.test(editingValue ?? '')
      ? parseInt(editingValue as string, 10)
      : 0;
    setEditingValue(null);
    props.onChange(value);
  };

  const handleIncrement = (e: React.MouseEvent<HTMLButtonElement>) => {
    execWhilePressed(e.target as HTMLElement, () => {
      props.onChange(props.value + 1);
    });
  };

  const handleDecrement = (e: React.MouseEvent<HTMLButtonElement>) => {
    execWhilePressed(e.target as HTMLElement, () => {
      props.onChange(props.value - 1);
    });
  };

  return (
    <NumberBlockWrapper>
      <Button
        type="button"
        onMouseDown={handleIncrement}
        data-cy={`${props.dataCy}-increment`}
      >+</Button>
      <Input
        type="text"
        value={editingValue !== null ? editingValue : formatTwoDigit(props.value)}
        onFocus={handleFocus}
        onChange={handleChange}
        onBlur={handleBlur}
        maxLength={2}
        data-cy={`${props.dataCy}-input`}
      />
      <Button
        type="button"
        onMouseDown={handleDecrement}
        data-cy={`${props.dataCy}-decrement`}
      >-</Button>
    </NumberBlockWrapper>
  );
};

(NumberBlock as any).propTypes = {
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  dataCy: PropTypes.string
};

export default NumberBlock;
