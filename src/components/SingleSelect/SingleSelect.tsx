import React, { useState, useEffect, useCallback } from 'react';
import Wrapper from './Wrapper';
import Item from './Item';

interface SingleSelectItem {
  value: string;
  label: string;
  description?: string;
}

interface SingleSelectProps {
  items: SingleSelectItem[];
  value?: string;
  onChange?: (event: { target: { value: string } }) => void;
  orientation?: 'horizontal' | 'vertical';
  readOnly?: boolean;
  dataCy?: string;
}

const SingleSelect: React.FC<SingleSelectProps> = ({
  items,
  value: valueProp,
  onChange,
  orientation = 'horizontal',
  readOnly,
  dataCy,
}) => {
  const [value, setValue] = useState<string | null>(valueProp || null);

  // Sync value from prop during render (equivalent to componentDidUpdate).
  // Using useEffect would cause a visible flash of the old value.
  const [prevValueProp, setPrevValueProp] = useState(valueProp);
  if (valueProp !== prevValueProp) {
    setPrevValueProp(valueProp);
    setValue(valueProp || null);
  }

  useEffect(() => {
    if (items.length === 1 && !valueProp && onChange) {
      onChange({ target: { value: items[0].value } });
    }
  }, [items, valueProp, onChange]);

  const handleClick = useCallback((newValue: string) => {
    if (readOnly !== true) {
      setValue(newValue);
      if (typeof onChange === 'function') {
        onChange({ target: { value: newValue } });
      }
    }
  }, [readOnly, onChange]);

  if (readOnly === true) {
    const getReadOnlyValue = () => {
      if (!value) {
        return '-';
      }
      const selectedItem = items.find(item => item.value === value);
      if (selectedItem) {
        return selectedItem.label;
      }
      return value;
    };

    return (
      <div>{getReadOnlyValue()}</div>
    );
  }

  const widthPercentage = orientation === 'horizontal'
    ? 100 / items.length
    : null;

  return (
    <Wrapper $orientation={orientation}>
      {items.map((item, index) => (
        <Item
          key={index}
          value={item.value}
          label={item.label}
          description={item.description}
          selected={value === item.value}
          widthPercentage={widthPercentage}
          orientation={orientation}
          onClick={handleClick}
          dataCy={`${dataCy}-${item.value}`}
        />
      ))}
    </Wrapper>
  );
};

export default SingleSelect;
