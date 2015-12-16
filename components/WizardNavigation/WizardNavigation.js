import React, { PropTypes, Component } from 'react';
import './WizardNavigation.scss';

class WizardNavigation extends Component {

  render() {
    const nextLabel = this.props.nextLabel || 'Weiter';
    return (
      <div className="WizardNavigation">
        <a onClick={this.cancel.bind(this)} className="cancel">Abbrechen</a>
        <a onClick={this.nextStep.bind(this)} className="next">{nextLabel}</a>
        <a onClick={this.previousStep.bind(this)} className="prev">Zurück</a>
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
