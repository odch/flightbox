import React, { PropTypes, Component } from 'react';
import './ModalDialog.scss';

class ModalDialog extends Component {

  maskClickHandler() {
    if (typeof this.props.onBlur === 'function') {
      this.props.onBlur();
    }
  }

  render() {
    return (
      <div className="ModalDialog">
        <div className="mask" onClick={this.maskClickHandler.bind(this)}></div>
        <div className="content">{this.props.content}</div>
      </div>
    );
  }
}

ModalDialog.propTypes = {
  content: PropTypes.element.isRequired,
  onBlur: PropTypes.func,
};

export default ModalDialog;
