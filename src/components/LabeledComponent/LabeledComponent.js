import React, { PropTypes, Component } from 'react';
import './LabeledComponent.scss';

class LabeledComponent extends Component {

  render() {
    const className = 'LabeledComponent ' + this.props.className;
    return (
      <div className={className}>
        <label>{this.props.label}</label>
        <div className="component-wrap">{this.props.component}</div>
      </div>
    );
  }
}

LabeledComponent.propTypes = {
  label: PropTypes.string.isRequired,
  component: PropTypes.element.isRequired,
  className: PropTypes.string,
};

export default LabeledComponent;
