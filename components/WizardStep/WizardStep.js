import React, { PropTypes, Component } from 'react';

class WizardStep extends Component {

  constructor(props) {
    super(props);
    this.state = {
      data: this.props.data || {},
    };
  }

  getUpdateHandlerDelegate(key, scope) {
    return function(e) {
      scope.updateData(key, e.target.value);
    };
  }

  updateData(key, value) {
    const data = this.state.data;
    data[key] = value;
    this.setState({
      data: data,
    });
    this.props.updateData(this.state.data);
  }
}

WizardStep.propTypes = {
  updateData: PropTypes.func,
  data: PropTypes.object,
};

export default WizardStep;
