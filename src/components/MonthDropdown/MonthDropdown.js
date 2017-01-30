import React from 'react';
import styled from 'styled-components';
import Dropdown from '../Dropdown';

const months = [{
  key: '1',
  label: 'Januar'
}, {
  key: '2',
  label: 'Februar'
}, {
  key: '3',
  label: 'März'
}, {
  key: '4',
  label: 'April'
}, {
  key: '5',
  label: 'Mai'
}, {
  key: '6',
  label: 'Juni'
}, {
  key: '7',
  label: 'Juli'
}, {
  key: '8',
  label: 'August'
}, {
  key: '9',
  label: 'September'
}, {
  key: '10',
  label: 'Oktober'
}, {
  key: '11',
  label: 'November'
}, {
  key: '12',
  label: 'Dezember'
}];

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
  className: React.PropTypes.string,
  value: React.PropTypes.number,
  onChange: React.PropTypes.func,
  readOnly: React.PropTypes.bool,
};

export default MonthDropdown;
