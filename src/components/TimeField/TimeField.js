import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { parse, normalize } from '../../util/time.js';
import Wrapper from './Wrapper';
import NumberBlock from './NumberBlock';
import update from 'immutability-helper';

class TimeField extends Component {

  constructor(props) {
    super(props);
    this.state = {
      value: this.parse(props.value),
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      value: this.parse(nextProps.value),
    });
  }

  render() {
    if (this.props.readOnly === true) {
      return (
        <div>
          {this.formatString(this.state.value)}
        </div>
      );
    }

    return (
      <Wrapper>
        <NumberBlock
          value={this.state.value.hours}
          onChange={this.updateHours.bind(this)}
          dataCy={`${this.props.dataCy}-hours`}
        />
        <span>:</span>
        <NumberBlock
          value={this.state.value.minutes}
          onChange={this.updateMinutes.bind(this)}
          dataCy={`${this.props.dataCy}-minutes`}
        />
      </Wrapper>
    );
  }

  updateHours(hours) {
    const newTime = update(this.state.value, {
      hours: { $set: hours },
    });
    this.setTime(newTime);
  }

  updateMinutes(minutes) {
    const newTime = update(this.state.value, {
      minutes: { $set: minutes },
    });
    this.setTime(newTime);
  }

  setTime(time) {
    this.setState({
      value: normalize(time),
    }, this.fireChangeEvent);
  }

  fireChangeEvent() {
    if (typeof this.props.onChange === 'function') {
      const stringValue = this.formatString(this.state.value);
      this.props.onChange({
        value: stringValue !== '00:00' ? stringValue : null,
      });
    }
  }

  parse(timeString) {
    return parse(timeString) || { hours: 0, minutes: 0 };
  }

  formatString(time) {
    return this.formatTwoDigit(time.hours) + ':' + this.formatTwoDigit(time.minutes);
  }

  formatTwoDigit(number) {
    return ('0' + number).slice(-2);
  }
}

TimeField.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  readOnly: PropTypes.bool,
  dataCy: PropTypes.string
};

export default TimeField;
