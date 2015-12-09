import React, { PropTypes, Component } from 'react';
import './IncrementationField.scss';

class IncrementationField extends Component {

  constructor(props) {
    super(props);
    this.state = {
      value: 0,
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
    });
  }

  increment() {
    this.setState({
      value: this.state.value + 1,
    });
  }
}

export default IncrementationField;
