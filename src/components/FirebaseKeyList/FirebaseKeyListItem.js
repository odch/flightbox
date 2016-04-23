import React, { PropTypes, Component } from 'react';

class FirebaseKeyListItem extends Component {

  render() {
    return (
      <div className="FirebaseKeyListItem">
        <span className="label">{this.props.label}</span>
        <button
          onClick={this.onRemoveClick.bind(this)}
          className="remove"
        >
          <i className="material-icons">block</i>
        </button>
      </div>
    );
  }

  onRemoveClick() {
    if (typeof this.props.onRemoveClick === 'function') {
      this.props.onRemoveClick();
    }
  }
}

FirebaseKeyListItem.propTypes = {
  label: PropTypes.string.isRequired,
  onRemoveClick: PropTypes.func,
};

export default FirebaseKeyListItem;
