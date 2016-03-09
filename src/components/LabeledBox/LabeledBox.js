import React, { PropTypes, Component } from 'react';
import './LabeledBox.scss';
import classNames from 'classnames';

class LabeledBox extends Component {

  render() {
    return (
      <div className={classNames('LabeledBox', this.props.className)}>
        <div className="label">{this.props.label}</div>
        <div className="content">{this.props.children}</div>
      </div>
    );
  }
}

LabeledBox.propTypes = {
  label: PropTypes.string.isRequired,
  className: PropTypes.string,
};

export default LabeledBox;
