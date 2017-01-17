import React from 'react';
import NumberBlockWrapper from './NumberBlockWrapper';
import Button from './Button';
import Input from './Input';

class NumberBlock extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      editingValue: null,
    }
  }

  render() {
    return (
      <NumberBlockWrapper>
        <Button type="button" onMouseDown={this.handleIncrement.bind(this)}>+</Button>
        <Input
          type="text"
          value={this.state.editingValue !== null ? this.state.editingValue : this.formatTwoDigit(this.props.value)}
          onFocus={e => e.target.select()}
          onChange={this.handleChange.bind(this)}
          onBlur={this.handleBlur.bind(this)}
          maxLength={2}
        />
        <Button type="button" onMouseDown={this.handleDecrement.bind(this)}>-</Button>
      </NumberBlockWrapper>
    );
  }

  handleChange(e) {
    if (/^\d{0,2}$/.test(e.target.value)) {
      this.setState({
        editingValue: e.target.value,
      });
    }
  }

  handleBlur() {
    const value = /^\d{1,2}$/.test(this.state.editingValue)
      ? parseInt(this.state.editingValue, 10)
      : 0;
    this.setState({
      editingValue: null,
    });
    this.props.onChange(value);
  }

  handleIncrement(e) {
    this.execWhilePressed(e.target, () => {
      const value = this.props.value + 1;
      this.props.onChange(value);
    });
  }

  handleDecrement(e) {
    this.execWhilePressed(e.target, () => {
      const value = this.props.value - 1;
      this.props.onChange(value);
    });
  }

  formatTwoDigit(number) {
    return ('0' + number).slice(-2);
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
}

NumberBlock.propTypes = {
  value: React.PropTypes.number.isRequired,
  onChange: React.PropTypes.func.isRequired,
};

export default NumberBlock;
