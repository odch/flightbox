import React from 'react';
import Dropdown from '../Dropdown';
import './UserDropdown.scss';

const optionRenderer = users => {
  const map = users.reduce((map, obj) => {
    map[obj.memberNr] = obj;
    return map;
  }, {});
  return option => (
    <div>
      <div className="name">{map[option.key].lastname} {map[option.key].firstname}</div>
      <div className="memberNr">{option.key}</div>
    </div>
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

const UserDropdown = props => (
  <Dropdown
    className="UserDropdown"
    options={props.users.data.array.sort(usersComparator).map(userToOption)}
    optionRenderer={optionRenderer(props.users.data.array)}
    onChange={callWithValue.bind(null, props.onChange, props.users.data.array)}
    value={props.value}
    noOptionsText="Kein Mitglied gefunden"
    moreOptionsText="Mehr Mitglieder vorhanden! Tippen Sie einen Teil der Mitgliedernummer, um die Liste einzuschränken."
    onFocus={props.onFocus}
    onBlur={callWithValue.bind(null, props.onBlur, props.users.data.array)}
  />
);

UserDropdown.propTypes = {
  value: React.PropTypes.string.isRequired,
  users: React.PropTypes.object.isRequired,
  onChange: React.PropTypes.func.isRequired,
  onFocus: React.PropTypes.func.isRequired,
  onBlur: React.PropTypes.func.isRequired,
};

export default UserDropdown;
