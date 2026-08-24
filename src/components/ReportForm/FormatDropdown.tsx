import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import Dropdown from '../Dropdown';
import { useTranslation } from 'react-i18next';

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

const FormatDropdown = props => {
  const { t } = useTranslation();
  const options = [{
    key: 'pdf',
    label: t('invoicesReport.formatPdf')
  }, {
    key: 'excel',
    label: t('invoicesReport.formatExcel')
  }];
  return (
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
      noOptionsText={t('dropdown.notFound')}
      mustSelect
    />
  );
};

FormatDropdown.propTypes = {
  className: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  readOnly: PropTypes.bool
};

export default FormatDropdown;
