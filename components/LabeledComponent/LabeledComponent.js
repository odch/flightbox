import React, { PropTypes, Component } from 'react';
import './LabeledComponent.scss';

class LabeledComponent extends Component {

  static propTypes = {
    label: PropTypes.string,
    className: PropTypes.string,
    component: PropTypes.element,
  };

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

export default LabeledComponent;
