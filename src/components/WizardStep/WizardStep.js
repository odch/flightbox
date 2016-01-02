import { PropTypes, Component } from 'react';
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
      data: nextProps.data,
    });
  }

  getUpdateHandlerDelegate(key) {
    return e => {
      this.updateData(key, e.target.value);
    };
  }

  getKeyUpHandlerDelegate(key) {
    return e => {
      if (typeof this.props.onKeyUp === 'function') {
        this.props.onKeyUp({
          key,
          value: e.target.value,
        });
      }
    };
  }

  updateData(key, value) {
    const data = update(this.state.data, {
      [key]: { $set: value },
    });
    this.setState({
      data,
    }, () => {
      this.props.updateData({
        key,
        value,
      });
    });
  }
}

WizardStep.propTypes = {
  updateData: PropTypes.func,
  onKeyUp: PropTypes.func,
  data: PropTypes.object,
};

export default WizardStep;
