import React, { PropTypes, Component } from 'react';
import './IncrementationField.scss';

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
        <div className="IncrementationField readonly">
          <span className="value">{this.state.value}</span>
        </div>
      );
    }

    return (
      <div className="IncrementationField">
        <a className="decrement" onClick={this.decrement.bind(this)}>-</a>
        <span className="value">{this.state.value}</span>
        <a className="increment" onClick={this.increment.bind(this)}>+</a>
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
