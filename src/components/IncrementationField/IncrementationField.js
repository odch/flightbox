import React, { PropTypes, Component } from 'react';
import './IncrementationField.scss';

class IncrementationField extends Component {

  constructor(props) {
    super(props);
    this.state = {
      value: this.props.value,
    };
  }

  render() {
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
    if (newValue < 0) newValue = 0;
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
  onChange: PropTypes.func,
};

IncrementationField.defaultProps = {
  value: 0,
};

export default IncrementationField;
