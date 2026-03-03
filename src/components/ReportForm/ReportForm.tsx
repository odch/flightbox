import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
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

const ReportForm = ({
  disabled,
  children,
  date,
  delimiter = ',',
  withMonth = true,
  withDelimiter = true,
  setDate,
  setDelimiter,
  generate,
  parameters,
}: {
  disabled?: boolean;
  children?: React.ReactNode;
  date?: { year?: number | null; month?: number | null };
  delimiter?: string;
  withMonth?: boolean;
  withDelimiter?: boolean;
  setDate: (date: any) => void;
  setDelimiter?: (delimiter: string) => void;
  generate: (date: any, parameters: any) => void;
  parameters?: any;
}) => {
  const { t } = useTranslation();
  const year = date && date.year ? date.year : '';
  const month = date && date.month ? date.month : null;

  const yearInput = (
    <Input
      type="number"
      value={year}
      onChange={handleYearChange.bind(null, { setDate, date })}
    />
  );
  const monthInput = (
    <MonthDropdown
      value={month}
      onChange={handleMonthChange.bind(null, { setDate, date })}
    />
  );

  const delimiterInput = (
    <DelimiterDropdown
      value={delimiter}
      onChange={setDelimiter}
    />
  )

  return (
    <form
      className="ReportForm"
      onSubmit={handleSubmit.bind(null, generate, date, parameters)}
    >
      <fieldset disabled={disabled}>
        <StyledLabeledComponent label={t('report.year')} component={yearInput}/>
        {withMonth && <StyledLabeledComponent label={t('report.month')} component={monthInput}/>}
        {withDelimiter && <StyledLabeledComponent label={t('report.delimiter')} component={delimiterInput}/>}
        {children}
        <Button
          type="submit"
          label={t('common.download')}
          icon="file_download"
          disabled={disabled || !year || !month}
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


export default ReportForm;
