import React, { Component, PropTypes } from 'react';
import { parse, normalize } from '../../util/time.js';
import './TimeField.scss';
import update from 'react-addons-update';

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
        <div className="TimeField readonly">
          {this.formatString(this.state.value)}
        </div>
      );
    }

    return (
      <div className="TimeField">
        <div className="number-block">
          <a className="increment" onMouseDown={this.incrementHours.bind(this)}>+</a>
          <input
            className="hours"
            type="text"
            value={this.formatTwoDigit(this.state.value.hours)}
            onFocus={e => e.target.select()}
            onChange={this.updateHours.bind(this)}
          />
          <a className="decrement" onMouseDown={this.decrementHours.bind(this)}>-</a>
        </div>
        <span>:</span>
        <div className="number-block">
          <a className="increment" onMouseDown={this.incrementMinutes.bind(this)}>+</a>
          <input
            className="minutes"
            type="text"
            value={this.formatTwoDigit(this.state.value.minutes)}
            onFocus={e => e.target.select()}
            onChange={this.updateMinutes.bind(this)}
          />
          <a className="decrement" onMouseDown={this.decrementMinutes.bind(this)}>-</a>
        </div>
      </div>
    );
  }

  incrementHours(e) {
    this.execWhilePressed(e.target, () => {
      const newTime = update(this.state.value, {
        hours: { $set: this.state.value.hours + 1 },
      });
      this.setTime(newTime);
    });
  }

  decrementHours(e) {
    this.execWhilePressed(e.target, () => {
      const newTime = update(this.state.value, {
        hours: { $set: this.state.value.hours - 1 },
      });
      this.setTime(newTime);
    });
  }

  incrementMinutes(e) {
    this.execWhilePressed(e.target, () => {
      const newTime = update(this.state.value, {
        minutes: { $set: this.state.value.minutes + 1 },
      });
      this.setTime(newTime);
    });
  }

  decrementMinutes(e) {
    this.execWhilePressed(e.target, () => {
      const newTime = update(this.state.value, {
        minutes: { $set: this.state.value.minutes - 1 },
      });
      this.setTime(newTime);
    });
  }

  updateHours(e) {
    const hours = /^\d+$/.test(e.target.value)
      ? parseInt(e.target.value, 10)
      : 0;
    const newTime = update(this.state.value, {
      hours: { $set: hours },
    });
    this.setTime(newTime);
  }

  updateMinutes(e) {
    const minutes = /^\d+$/.test(e.target.value)
      ? parseInt(e.target.value, 10)
      : 0;
    const newTime = update(this.state.value, {
      minutes: { $set: minutes },
    });
    this.setTime(newTime);
  }

  execWhilePressed(element, func) {
    func();

    const interval = window.setInterval(func, 150);

    const clearFunc = () => {
      window.clearInterval(interval);
    };

    element.addEventListener('mouseup', clearFunc);
    element.addEventListener('mouseout', clearFunc);
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
};

export default TimeField;
