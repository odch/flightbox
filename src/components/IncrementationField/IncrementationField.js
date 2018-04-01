import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Button from './Button';
import Value from './Value';

class IncrementationField extends Component {

  constructor(props) {
    super(props);
    const value = typeof this.props.value === 'undefined' ? this.props.minValue : this.props.value;
    if (value < this.props.minValue) {
      throw new Error('Given value ' + value + ' is lower than min value ' + this.props.minValue);
    }
    this.state = {
      value,
    };
  }

  render() {
    if (this.props.readOnly === true) {
      return (
        <div>
          <Value>{this.state.value}</Value>
        </div>
      );
    }

    return (
      <div>
        <Button type="button" onClick={this.decrement.bind(this)}>-</Button>
        <Value>{this.state.value}</Value>
        <Button type="button" onClick={this.increment.bind(this)}>+</Button>
      </div>
    );
  }

  decrement() {
    let newValue = this.state.value - 1;
    if (newValue < this.props.minValue) newValue = this.props.minValue;
    this.setState({
      value: newValue,
    }, this.fireChangeEvent.bind(this));
  }

  increment() {
    this.setState({
      value: this.state.value + 1,
    }, this.fireChangeEvent.bind(this));
  }

  fireChangeEvent() {
    if (typeof this.props.onChange === 'function') {
      this.props.onChange({
        target: {
          value: this.state.value,
        },
      });
    }
  }
}

IncrementationField.propTypes = {
  value: PropTypes.number,
  minValue: PropTypes.number,
  onChange: PropTypes.func,
  readOnly: PropTypes.bool,
};

IncrementationField.defaultProps = {
  minValue: 0,
};

export default IncrementationField;
