import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import Dropdown from '../Dropdown';
import dates from '../../util/dates'

const months = dates.monthNames.map((monthName, index) => ({
  key: (index + 1).toString(),
  label: monthName
}))

const Option = styled.div`
  padding: 0.2em;
`;

const filterOptions = (options, filter) =>
  options.filter(option => option.label.toUpperCase().indexOf(filter.toUpperCase()) > -1);

const renderOption = option => <Option>{option.label}</Option>;

const renderValue = option => option.label;

const toStringValue = value => value == null ? null : value.toString();

const parseNumber = value => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return parseInt(value);
  }
  return null;
};

const handleChange = (onChange, value) => {
  if (typeof onChange === 'function') {
    onChange(parseNumber(value));
  }
};

const MonthDropdown = props => (
  <Dropdown
    className={props.className}
    options={months}
    value={toStringValue(props.value)}
    onChange={handleChange.bind(null, props.onChange)}
    readOnly={props.readOnly}
    optionFilter={filterOptions}
    optionRenderer={renderOption}
    valueRenderer={renderValue}
    optionsRenderLimit={months.length}
    noOptionsText="Monat nicht gefunden"
    mustSelect
  />
);

MonthDropdown.propTypes = {
  className: PropTypes.string,
  value: PropTypes.number,
  onChange: PropTypes.func,
  readOnly: PropTypes.bool,
};

export default MonthDropdown;
