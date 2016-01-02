import React, { PropTypes, Component } from 'react';
import './WizardNavigation.scss';

class WizardNavigation extends Component {

  render() {
    const nextLabel = this.props.nextLabel || 'Weiter';
    return (
      <div className="WizardNavigation">
        <a onMouseDown={this.cancel.bind(this)} className="cancel" tabIndex="-1">Abbrechen</a>
        <a onMouseDown={this.nextStep.bind(this)} className="next" tabIndex="-1">{nextLabel}</a>
        <a onMouseDown={this.previousStep.bind(this)} className="prev" tabIndex="-1">Zurück</a>
      </div>
    );
  }

  cancel() {
    this.props.cancel();
  }

  previousStep() {
    this.props.previousStep();
  }

  nextStep() {
    this.props.nextStep();
  }
}

WizardNavigation.propTypes = {
  cancel: PropTypes.func,
  previousStep: PropTypes.func,
  nextStep: PropTypes.func,
  nextLabel: PropTypes.string,
};

export default WizardNavigation;
