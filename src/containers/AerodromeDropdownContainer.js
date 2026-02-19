import PropTypes from 'prop-types';
import React, {useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {loadAerodromes} from '../modules/aerodromes';
import AerodromeDropdown from '../components/AerodromeDropdown';

const AerodromeDropdownContainer = ({ value, onChange, onFocus, onBlur, readOnly, dataCy }) => {
  const dispatch = useDispatch();
  const aerodromes = useSelector((state) => state.aerodromes);

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

AerodromeDropdownContainer.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onFocus: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
  dataCy: PropTypes.string,
};

export default AerodromeDropdownContainer;
