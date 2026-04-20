import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { parse, normalize } from '../../util/time';
import Wrapper from './Wrapper';
import NumberBlock from './NumberBlock';
import update from 'immutability-helper';

const parseValue = (timeString: unknown) =>
  parse(timeString) || { hours: 0, minutes: 0 };

const formatTwoDigit = (n: number) => ('0' + n).slice(-2);

const formatString = (time: { hours: number; minutes: number }) =>
  formatTwoDigit(time.hours) + ':' + formatTwoDigit(time.minutes);

const TimeField = (props: any) => {
  const [state, setState] = useState(() => ({
    value: parseValue(props.value),
    prevPropsValue: props.value,
  }));

  let currentValue = state.value;
  if (props.value !== state.prevPropsValue) {
    currentValue = parseValue(props.value);
    setState({
      value: currentValue,
      prevPropsValue: props.value,
    });
  }

  const setTime = (time: { hours: number; minutes: number }) => {
    const normalized = normalize(time);
    setState({
      value: normalized,
      prevPropsValue: props.value,
    });
    if (typeof props.onChange === 'function') {
      const stringValue = formatString(normalized);
      props.onChange({
        value: stringValue !== '00:00' ? stringValue : null,
      });
    }
  };

  const updateHours = (hours: number) => {
    setTime(update(currentValue, { hours: { $set: hours } }));
  };

  const updateMinutes = (minutes: number) => {
    setTime(update(currentValue, { minutes: { $set: minutes } }));
  };

  if (props.readOnly === true) {
    return (
      <div>
        {formatString(currentValue)}
      </div>
    );
  }

  return (
    <Wrapper>
      <NumberBlock
        value={currentValue.hours}
        onChange={updateHours}
        dataCy={`${props.dataCy}-hours`}
      />
      <span>:</span>
      <NumberBlock
        value={currentValue.minutes}
        onChange={updateMinutes}
        dataCy={`${props.dataCy}-minutes`}
      />
    </Wrapper>
  );
};

(TimeField as any).propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  readOnly: PropTypes.bool,
  dataCy: PropTypes.string
};

export default TimeField;
