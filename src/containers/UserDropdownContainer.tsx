import React, { useEffect } from 'react';
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

type Props = OwnProps & {
  users: object;
  loadUsers: () => void;
};

const UserDropdownContainer = (props: Props) => {
  useEffect(() => {
    props.loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <UserDropdown
      users={props.users}
      value={props.value ?? ''}
      onChange={props.onChange}
      onFocus={props.onFocus}
      onBlur={props.onBlur}
      readOnly={props.readOnly}
      dataCy={props.dataCy}
    />
  );
};

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
