import PropTypes from 'prop-types';
import React from 'react';
import Dropdown from '../Dropdown';
import Option from './Option';
import { useTranslation } from 'react-i18next';

const optionRenderer = users => {
  const map = users.reduce((map, obj) => {
    map[obj.memberNr] = obj;
    return map;
  }, {});
  return (option, focussed) => (
    <Option
      name={map[option.key].lastname + ' ' + map[option.key].firstname}
      memberNr={option.key}
      focussed={focussed}
    />
  );
};

const toOption = key => ({
  key,
  label: key,
});

const userToOption = user => toOption(user.memberNr);

const usersComparator = (user1, user2) => user1.lastname.localeCompare(user2.lastname);

const callWithValue = (delegate, users, value) => {
  const user = users.find(item => item.memberNr === value);
  if (user) {
    delegate(user);
  } else {
    delegate({
      memberNr: value,
    });
  }
};

const UserDropdown = props => {
  const { t } = useTranslation();
  return (
    <Dropdown
      className="UserDropdown"
      options={props.users.data.array.sort(usersComparator).map(userToOption)}
      optionRenderer={optionRenderer(props.users.data.array)}
      onChange={callWithValue.bind(null, props.onChange, props.users.data.array)}
      value={props.value}
      showOptionsOnFocus={false}
      noOptionsText={t('userDropdown.noMember')}
      moreOptionsText={t('userDropdown.moreMembers')}
      onFocus={props.onFocus}
      onBlur={callWithValue.bind(null, props.onBlur, props.users.data.array)}
      readOnly={props.readOnly}
      dataCy={props.dataCy}
      clearable
    />
  );
};

UserDropdown.propTypes = {
  value: PropTypes.string.isRequired,
  users: PropTypes.object.isRequired,
  readOnly: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  onFocus: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
  dataCy: PropTypes.string
};

export default UserDropdown;
