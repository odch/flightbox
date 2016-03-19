import React, { PropTypes, Component } from 'react';

class UserItem extends Component {

  render() {
    return (
      <div className="UserItem">
        <span className="name">{this.props.item.value.lastname} {this.props.item.value.firstname}</span>
        <span className="memberNr">{this.props.item.value.memberNr}</span>
      </div>
    );
  }
}

UserItem.propTypes = {
  item: PropTypes.object.isRequired,
};

export default UserItem;
