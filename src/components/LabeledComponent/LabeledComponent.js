import React, { PropTypes, Component } from 'react';
import './LabeledComponent.scss';

class LabeledComponent extends Component {

  render() {
    let className = 'LabeledComponent ' + this.props.className;

    let validationMsg;

    if (this.props.validationError) {
      className += ' invalid';

      validationMsg = (
        <div className="validation-msg">
          <div className="icon"><i className="material-icons">error</i></div>
          <div className="text">{this.props.validationError}</div>
        </div>
      );
    }

    return (
      <div className={className}>
        <label>{this.props.label}</label>
        {validationMsg}
        <div className="component-wrap">{this.props.component}</div>
      </div>
    );
  }
}

LabeledComponent.propTypes = {
  label: PropTypes.string.isRequired,
  component: PropTypes.element.isRequired,
  className: PropTypes.string,
  validationError: PropTypes.string,
};

export default LabeledComponent;
