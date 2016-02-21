import React, { PropTypes, Component } from 'react';
import './UserList.scss';
import SearchTerms from '../../util/SearchTerms.js';
import FilteredList from '../FilteredList';
import Config from 'Config';
import UserItem from './UserItem.js';

class UserList extends Component {

  buildSearchTerms() {
    const searchTerms = new SearchTerms();
    if (this.props.memberNr) {
      searchTerms.child('memberNr', this.props.memberNr.trim());
    }
    return searchTerms;
  }

  render() {
    const emptyTitle = 'MFGT-Mitglied auswählen';
    const emptyMessage = 'Tippen Sie die ersten Zahlen der Mitgliedernummer und wählen ' +
      'Sie anschliessend aus der Liste hier aus.';

    const searchTerms = this.buildSearchTerms();

    const itemComparator = (user1, user2) => user1.value.lastname.localeCompare(user2.value.lastname);

    return (
      <FilteredList
        className="UserList"
        emptyTitle={emptyTitle}
        emptyMessage={emptyMessage}
        searchTerms={searchTerms}
        itemComponentClass={UserItem}
        firebaseUri={Config.firebaseUrl + '/users/'}
        itemComparator={itemComparator}
        onClick={this.props.onClick}
      />
    );
  }
}

UserList.propTypes = {
  memberNr: PropTypes.string,
  onClick: PropTypes.func,
};

export default UserList;
