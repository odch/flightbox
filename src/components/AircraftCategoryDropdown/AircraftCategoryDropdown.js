import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import Dropdown from '../Dropdown';
import {categories} from '../../util/aircraftCategories';

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

const AircraftCategoryDropdown = props => (
  <Dropdown
    className={props.className}
    options={categories.map(category => ({ key: category, label: category }))}
    value={props.value}
    onChange={handleChange.bind(null, props.onChange)}
    readOnly={props.readOnly}
    optionFilter={filterOptions}
    optionRenderer={renderOption}
    valueRenderer={renderValue}
    optionsRenderLimit={categories.length}
    noOptionsText="Kategorie nicht gefunden"
    mustSelect
  />
);

AircraftCategoryDropdown.propTypes = {
  className: PropTypes.string,
  value: PropTypes.number,
  onChange: PropTypes.func,
  readOnly: PropTypes.bool,
};

export default AircraftCategoryDropdown;
