import React, {useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {loadAerodromes} from '../modules/aerodromes';
import AerodromeDropdown from '../components/AerodromeDropdown';
import {RootState} from '../modules';

interface Props {
  value?: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  readOnly?: boolean;
  dataCy?: string;
}

const AerodromeDropdownContainer = ({
  value,
  onChange,
  onFocus,
  onBlur,
  readOnly,
  dataCy,
}: Props) => {
  const dispatch = useDispatch();
  const aerodromes = useSelector((state: RootState) => state.aerodromes);

  useEffect(() => {
    dispatch(loadAerodromes());
  }, [dispatch]);

  return (
    <AerodromeDropdown
      aerodromes={aerodromes}
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      readOnly={readOnly}
      dataCy={dataCy}
    />
  );
};

export default AerodromeDropdownContainer;
