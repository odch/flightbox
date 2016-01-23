import React, { PropTypes, Component } from 'react';
import './AirportList.scss';
import SearchTerms from '../../util/SearchTerms.js';
import FilteredList from '../FilteredList';
import Config from 'Config';
import AirportItem from './AirportItem.js';

class AirportList extends Component {

  buildSearchTerms() {
    const searchTerms = new SearchTerms();
    if (this.props.airport) {
      searchTerms.key(this.props.airport.toUpperCase().trim(), ['LS']);
      searchTerms.child('name', this.props.airport.toUpperCase().trim());
    }
    return searchTerms;
  }

  render() {
    const emptyMessage = 'Tippen Sie die ersten Buchstaben der ICAO-Identifikation oder des Namens und wählen ' +
      'Sie anschliessend aus der Liste hier aus.';

    const searchTerms = this.buildSearchTerms();

    const itemComparator = (airport1, airport2) => airport1.value.name.localeCompare(airport2.value.name);

    return (
      <FilteredList
        className="AirportList"
        emptyMessage={emptyMessage}
        searchTerms={searchTerms}
        itemComponentClass={AirportItem}
        firebaseUri={Config.firebaseUrl + '/airports/'}
        itemComparator={itemComparator}
        onClick={this.props.onClick}
      />
    );
  }
}

AirportList.propTypes = {
  airport: PropTypes.string,
  onClick: PropTypes.func,
};

export default AirportList;
