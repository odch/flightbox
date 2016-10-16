import React, { Component } from 'react';
import { connect } from 'react-redux';
import { loadUsers } from '../modules/users';
import UserDropdown from '../components/UserDropdown';

class UserDropdownContainer extends Component {

  componentWillMount() {
    this.props.loadUsers();
  }

  render() {
    return (
      <UserDropdown
        users={this.props.users}
        value={this.props.value}
        onChange={this.props.onChange}
        onFocus={this.props.onFocus}
        onBlur={this.props.onBlur}
      />
    );
  }
}

UserDropdownContainer.propTypes = {
  loadUsers: React.PropTypes.func.isRequired,
  users: React.PropTypes.object.isRequired,
  value: React.PropTypes.string,
  onChange: React.PropTypes.func.isRequired,
  onFocus: React.PropTypes.func.isRequired,
  onBlur: React.PropTypes.func.isRequired,
};

const mapStateToProps = (state, ownProps) => {
  return {
    users: state.users,
    value: ownProps.value,
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    loadUsers: () => dispatch(loadUsers()),
    onChange: ownProps.onChange,
    onFocus: ownProps.onFocus,
    onBlur: ownProps.onBlur,
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(UserDropdownContainer);
