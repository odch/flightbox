import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { format } from 'date-fns';
import ModalDialog from '../ModalDialog';
import MaterialIcon from '../MaterialIcon';
import dates from '../../util/dates';
import Wrapper from './Wrapper';
import Calendar from './Calendar';
import ClearButton from './ClearButton';
import Value from './Value';

const DatePicker = (props: any) => {
  const { clearable = false, readOnly, dataCy, onChange, onBlur, blockedPeriods } = props;

  const [showPicker, setShowPicker] = useState(false);
  const [state, setState] = useState(() => ({
    value: props.value,
    prevPropsValue: props.value,
  }));

  let currentValue = state.value;
  if (props.value !== state.prevPropsValue) {
    currentValue = props.value;
    setState({ value: props.value, prevPropsValue: props.value });
  }

  // Leaving the picker leaves the field, as the blur of an input does: a
  // form shows the field's errors from then on (react-final-form's touched)
  const closePicker = () => {
    setShowPicker(false);
    if (typeof onBlur === 'function') {
      onBlur();
    }
  };

  // The calendar's days are midnight of the browser's time zone: the date
  // a day shows, whatever the zone
  const handleDayClick = (date: Date | null | undefined) => {
    const dateString = date ? format(date, 'yyyy-MM-dd') : null;
    setState({ value: dateString, prevPropsValue: props.value });
    if (typeof onChange === 'function') {
      onChange({ value: dateString });
    }
    closePicker();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent call of outer div onClick handler
    handleDayClick(null);
  };

  if (readOnly === true) {
    return (
      <Wrapper readOnly>
        <Value>
          {currentValue ? dates.formatDate(currentValue) : '\u00a0'}
        </Value>
      </Wrapper>
    );
  }

  const dialog = showPicker ? (
    <ModalDialog
      content={
        <Calendar
          value={currentValue}
          onSelect={handleDayClick}
          clearable={clearable}
          blockedPeriods={blockedPeriods}
        />
      }
      onBlur={closePicker}
      fullWidthThreshold={0}
    />
  ) : null;

  return (
    <Wrapper>
      <Value onClick={() => setShowPicker(true)} data-cy={dataCy}>
        {currentValue ? dates.formatDate(currentValue) : '\u00a0'}
        {clearable === true && currentValue
          ? <ClearButton onClick={handleClear} type="button">
              <MaterialIcon icon="clear"/>
          </ClearButton>
          : null}
      </Value>
      {dialog}
    </Wrapper>
  );
};

(DatePicker as any).propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  clearable: PropTypes.bool,
  readOnly: PropTypes.bool,
  // Days to mark, with their reasons (Calendar's BlockedPeriod)
  blockedPeriods: PropTypes.arrayOf(PropTypes.shape({
    from: PropTypes.string.isRequired,
    to: PropTypes.string.isRequired,
    reason: PropTypes.string.isRequired,
  })),
};

export default DatePicker;
