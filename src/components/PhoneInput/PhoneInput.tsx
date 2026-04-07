import React, { useCallback } from 'react';
import Input from '../Input';

const filterPhoneValue = (value: string) =>
  value.replace(/[^\d\s+\-().\/]/g, '');

interface PhoneInputProps {
  onChange: (value: string) => void;
  value?: string;
  [key: string]: any;
}

const PhoneInput = ({ onChange, value, ...rest }: PhoneInputProps) => {

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const filtered = filterPhoneValue(e.target.value);
      onChange(filtered);
    },
    [onChange]
  );

  return (
    <Input {...rest} type="tel" value={value || ''} onChange={handleChange} />
  );
};

export default PhoneInput;
