import React, { PropTypes, Component } from 'react';
import './LabeledComponent.scss';

class LabeledComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      tooltipVisible: false,
    };
  }

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
      <div className={className} onFocus={this.onFocus.bind(this)} onBlur={this.onBlur.bind(this)}>
        <label>{this.props.label}</label>
        {validationMsg}
        <div className="component-wrap">{this.props.component}</div>
        {this.state.tooltipVisible && this.props.tooltip && <div className="tooltip">{this.props.tooltip}</div>}
      </div>
    );
  }

  onFocus() {
    this.setState({
      tooltipVisible: true,
    });
  }

  onBlur() {
    this.setState({
      tooltipVisible: false,
    });
  }
}

LabeledComponent.propTypes = {
  label: PropTypes.string.isRequired,
  component: PropTypes.element.isRequired,
  className: PropTypes.string,
  validationError: PropTypes.string,
  tooltip: PropTypes.string,
};

export default LabeledComponent;
