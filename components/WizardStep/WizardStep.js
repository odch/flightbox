import React, { PropTypes, Component } from 'react';

class WizardStep extends Component {

  static propTypes = {
    updateData: PropTypes.func,
    data: PropTypes.object,
  };

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

export default WizardStep;
