import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import Input from '../Input';
import Button from '../Button';
import LabeledComponent from '../LabeledComponent';
import MonthDropdown from '../MonthDropdown';
import DelimiterDropdown from './DelimiterDropdown';

const StyledLabeledComponent = styled(LabeledComponent)`
  width: 50%;
  margin-bottom: 1.5em;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const handleSubmit = (generate, date, parameters, e) => {
  e.preventDefault();
  generate(date, parameters);
};

const parseNumber = value => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    if (/^\d+$/.test(value)) {
      const numberValue = parseInt(value);
      if (numberValue > 0) {
        return numberValue;
      }
    }
  }
  return null;
};

const handleYearChange = (props, e) => props.setDate({
  year: parseNumber(e.target.value),
  month: props.date.month,
});

const handleMonthChange = (props, value) => props.setDate({
  year: props.date.year,
  month: value
});

const ReportForm = props => {
  const year = props.date && props.date.year ? props.date.year : '';
  const month = props.date && props.date.month ? props.date.month : null;
  const delimiter = props.delimiter || ',';

  const yearInput = (
    <Input
      type="number"
      value={year}
      onChange={handleYearChange.bind(null, props)}
    />
  );
  const monthInput = (
    <MonthDropdown
      value={month}
      onChange={handleMonthChange.bind(null, props)}
    />
  );

  const delimiterInput = (
    <DelimiterDropdown
      value={delimiter}
      onChange={props.setDelimiter}
    />
  )

  return (
    <form
      className="ReportForm"
      onSubmit={handleSubmit.bind(null, props.generate, props.date, props.parameters)}
    >
      <fieldset disabled={props.disabled}>
        <StyledLabeledComponent label="Jahr" component={yearInput}/>
        {props.withMonth && <StyledLabeledComponent label="Monat" component={monthInput}/>}
        {props.withDelimiter && <StyledLabeledComponent label="Trennzeichen" component={delimiterInput}/>}
        {props.children}
        <Button
          type="submit"
          label="Herunterladen"
          icon="file_download"
          disabled={props.disabled || !year || !month}
          primary/>
      </fieldset>
    </form>
  );
};

ReportForm.propTypes = {
  disabled: PropTypes.bool,
  children: PropTypes.node,
  date: PropTypes.shape({
    year: PropTypes.number,
    month: PropTypes.number,
  }),
  delimiter: PropTypes.string,
  withMonth: PropTypes.bool,
  withDelimiter: PropTypes.bool,
  setDate: PropTypes.func.isRequired,
  setDelimiter: PropTypes.func,
  generate: PropTypes.func.isRequired,
};

ReportForm.defaultProps = {
  withMonth: true,
  withDelimiter: true
};

export default ReportForm;
