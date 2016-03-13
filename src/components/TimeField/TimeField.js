import React, { Component, PropTypes } from 'react';
import './TimeField.scss';
import TimePicker from 'react-time-picker';

class TimeField extends Component {

  constructor(props) {
    super(props);
    this.state = {
      value: props.value,
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      value: nextProps.value,
    });
  }

  render() {
    if (this.props.readOnly === true) {
      return (
        <div className="TimeField readonly">
          {this.state.value}
        </div>
      );
    }

    return (
      <div className="TimeField">
        <TimePicker
          value={this.state.value}
          defaultValue="00:00"
          onChange={this.updateValueHandler.bind(this)}
        />
      </div>
    );
  }

  updateValueHandler(timeString) {
    this.setState({
      value: timeString,
    });
    if (typeof this.props.onChange === 'function') {
      this.props.onChange({
        value: timeString,
      });
    }
  }
}

TimeField.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  readOnly: PropTypes.bool,
};

export default TimeField;
