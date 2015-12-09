import React, { PropTypes, Component } from 'react';

class WizardStep extends Component {

  static propTypes = {
    updateData: PropTypes.func,
  };

  updateData(data) {
    this.props.updateData(data);
  }
}

export default WizardStep;
