import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Wrapper from './Wrapper';
import Item from './Item';

class SingleSelect extends Component {

  constructor(props) {
    super(props);
    this.state = {
      value: this.props.value || null,
    };
  }

  componentDidMount() {
    this.selectSingleItem()
  }

  componentDidUpdate(prevProps) {
    this.selectSingleItem()
    if (prevProps.value !== this.props.value) {
      this.setState({
        value: this.props.value
      })
    }
  }

  render() {
    if (this.props.readOnly === true) {
      return (
        <div>{this.getReadOnlyValue()}</div>
      )
    }

    const orientation = this.props.orientation;

    const widthPercentage = orientation === 'horizontal'
      ? 100 / this.props.items.length
      : null;

    return (
      <Wrapper orientation={orientation}>
        {this.props.items.map((item, index) => (
          <Item
            key={index}
            value={item.value}
            label={item.label}
            description={item.description}
            selected={this.state.value === item.value}
            widthPercentage={widthPercentage}
            orientation={orientation}
            onClick={this.clickHandler.bind(this)}
            dataCy={`${this.props.dataCy}-${item.value}`}
          />
        ))}
      </Wrapper>
    );
  }

  clickHandler(value) {
    if (this.props.readOnly !== true) {
      this.setState({
        value,
      }, this.fireChangeEvent);
    }
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

  getReadOnlyValue() {
    if (!this.state.value) {
      return '-';
    }

    const selectedItem = this.props.items.find(item => item.value === this.state.value);
    if (selectedItem) {
      return selectedItem.label;
    }

    return this.state.value;
  }

  selectSingleItem() {
    if (this.props.items.length === 1 && !this.props.value && this.props.onChange) {
      this.props.onChange({
        target: {
          value: this.props.items[0].value
        }
      })
    }
  }
}

SingleSelect.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired
  })).isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func,
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  readOnly: PropTypes.bool,
  dataCy: PropTypes.string
};

SingleSelect.defaultProps = {
  orientation: 'horizontal'
};

export default SingleSelect;
