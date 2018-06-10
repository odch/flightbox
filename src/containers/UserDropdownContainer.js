import PropTypes from 'prop-types';
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
        readOnly={this.props.readOnly}
        dataCy={this.props.dataCy}
      />
    );
  }
}

UserDropdownContainer.propTypes = {
  loadUsers: PropTypes.func.isRequired,
  users: PropTypes.object.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onFocus: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
  dataCy: PropTypes.string
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
