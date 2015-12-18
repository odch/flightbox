import React, { PropTypes, Component } from 'react';
import update from 'react-addons-update';

class WizardStep extends Component {

  constructor(props) {
    super(props);
    this.state = {
      data: this.props.data || {},
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      data: nextProps.data
    });
  }

  getUpdateHandlerDelegate(key, scope) {
    return function(e) {
      scope.updateData(key, e.target.value);
    };
  }

  updateData(key, value) {
    var data = update(this.state.data, {
      [key]: { $set: value }
    });
    this.setState({
      data: data
    }, function() {
      this.props.updateData(this.state.data);
    }, this);
  }
}

WizardStep.propTypes = {
  updateData: PropTypes.func,
  data: PropTypes.object,
};

export default WizardStep;
