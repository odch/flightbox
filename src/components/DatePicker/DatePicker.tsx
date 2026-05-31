import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { de } from 'date-fns/locale/de';
import { enGB } from 'date-fns/locale/en-GB';
import ModalDialog from '../ModalDialog';
import MaterialIcon from '../MaterialIcon';
import dates from '../../util/dates';
import Wrapper from './Wrapper';
import DayPicker from './DayPicker';
import ClearButton from './ClearButton';
import Value from './Value';

const DatePicker = (props: any) => {
  const { i18n } = useTranslation();
  const { clearable = false, readOnly, dataCy, onChange } = props;

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

  const handleDayClick = (date: Date | null | undefined) => {
    const dateString = date ? dates.localDate(date as any) : null;
    setShowPicker(false);
    setState({ value: dateString, prevPropsValue: props.value });
    if (typeof onChange === 'function') {
      onChange({ value: dateString });
    }
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

  const renderPicker = () => {
    const date = currentValue ? new Date(currentValue) : undefined;
    const locale = i18n?.language === 'en' ? enGB : de;
    return (
      <DayPicker
        mode="single"
        required={!clearable}
        selected={date}
        defaultMonth={date}
        onSelect={handleDayClick}
        locale={locale}
        weekStartsOn={1}
      />
    );
  };

  const dialog = showPicker ? (
    <ModalDialog
      content={renderPicker()}
      onBlur={() => setShowPicker(false)}
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
  clearable: PropTypes.bool,
  readOnly: PropTypes.bool,
};

export default DatePicker;
