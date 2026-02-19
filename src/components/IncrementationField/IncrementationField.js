import PropTypes from 'prop-types';
import React, {Component} from 'react';
import Button from './Button';
import Value from './Value';

class IncrementationField extends Component {

  render() {
    const value = typeof this.props.value === 'undefined' ? this.props.minValue : this.props.value;

    if (this.props.readOnly === true) {
      return (
        <div>
          <Value>{value}</Value>
        </div>
      );
    }

    return (
      <div>
        <Button type="button" onClick={() => this.change(value - 1)} data-cy={`${this.props.dataCy}-decrement`}>-</Button>
        <Value>{value}</Value>
        <Button type="button" onClick={() => this.change(value + 1)} data-cy={`${this.props.dataCy}-increment`}>+</Button>
      </div>
    );
  }

  change(newValue) {
    if (newValue < this.props.minValue) newValue = this.props.minValue;
    if (typeof this.props.onChange === 'function') {
      this.props.onChange({ target: { value: newValue } });
    }
  }
}

IncrementationField.propTypes = {
  value: PropTypes.number,
  minValue: PropTypes.number,
  onChange: PropTypes.func,
  readOnly: PropTypes.bool,
  dataCy: PropTypes.string
};

IncrementationField.defaultProps = {
  minValue: 0,
};

export default IncrementationField;
