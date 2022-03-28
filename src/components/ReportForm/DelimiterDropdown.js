import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import Dropdown from '../Dropdown';

const options = [{
  key: ',',
  label: 'Komma (,)'
}, {
  key: ';',
  label: 'Semikolon (;)'
}];

const Option = styled.div`
  padding: 0.2em;
`;

const filterOptions = (options, filter) =>
  options.filter(option => option.label.toUpperCase().indexOf(filter.toUpperCase()) > -1);

const renderOption = option => <Option>{option.label}</Option>;

const renderValue = option => option.label;

const handleChange = (onChange, value) => {
  if (typeof onChange === 'function') {
    onChange(value);
  }
};

const DelimiterDropdown = props => (
  <Dropdown
    className={props.className}
    options={options}
    value={props.value}
    onChange={handleChange.bind(null, props.onChange)}
    readOnly={props.readOnly}
    optionFilter={filterOptions}
    optionRenderer={renderOption}
    valueRenderer={renderValue}
    optionsRenderLimit={options.length}
    noOptionsText="Nicht gefunden"
    mustSelect
  />
);

DelimiterDropdown.propTypes = {
  className: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  readOnly: PropTypes.bool
};

export default DelimiterDropdown;
