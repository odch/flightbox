import React, {Component} from 'react';
import {connect} from 'react-redux';
import {loadUsers} from '../modules/users';
import UserDropdown from '../components/UserDropdown';
import {RootState} from '../modules';

interface OwnProps {
  value?: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  readOnly?: boolean;
  dataCy?: string;
}

class UserDropdownContainer extends Component<OwnProps & {
  users: object;
  loadUsers: () => void;
}> {
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

const mapStateToProps = (state: RootState, ownProps: OwnProps) => ({
  users: state.users,
  value: ownProps.value,
});

const mapDispatchToProps = (dispatch: any, ownProps: OwnProps) => ({
  loadUsers: () => dispatch(loadUsers()),
  onChange: ownProps.onChange,
  onFocus: ownProps.onFocus,
  onBlur: ownProps.onBlur,
});

export default connect(mapStateToProps, mapDispatchToProps)(UserDropdownContainer);
