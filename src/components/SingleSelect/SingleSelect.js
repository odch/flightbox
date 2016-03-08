import React, { PropTypes, Component } from 'react';
import './SingleSelect.scss';

class SingleSelect extends Component {

  constructor(props) {
    super(props);
    this.state = {
      value: this.props.value || null,
    };
  }

  render() {
    const orientation = this.props.orientation || 'horizontal';

    const buttonStyle = {};

    if (orientation === 'horizontal') {
      buttonStyle.width = (100 / this.props.items.length) + '%';
    }

    return (
      <div className={'SingleSelect ' + orientation}>
        {this.props.items.map((item, index) => {
          const className = this.state.value === item.value ? 'selected' : '';
          return (
            <button
              key={index}
              className={className}
              style={buttonStyle}
              onClick={this.clickHandler.bind(this, item.value)}
            >
              <div className="label-wrap">
                <div className="label">{item.label}</div>
                {item.description ? <div className="description">{item.description}</div> : null}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  clickHandler(value) {
    this.setState({
      value,
    }, this.fireChangeEvent);
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

SingleSelect.propTypes = {
  items: PropTypes.array.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func,
  orientation: PropTypes.string,
};

export default SingleSelect;
