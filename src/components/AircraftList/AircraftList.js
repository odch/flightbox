import React, { PropTypes, Component } from 'react';
import './AircraftList.scss';
import SearchTerms from '../../util/SearchTerms.js';
import FilteredList from '../FilteredList';
import Config from 'Config';
import AircraftItem from './AircraftItem.js';

class AircraftList extends Component {

  buildSearchTerms() {
    const searchTerms = new SearchTerms();
    if (this.props.immatriculation) {
      searchTerms.key(this.props.immatriculation.toUpperCase().trim(), ['HB', 'D', 'OE', 'I', 'F', 'N']);
    }
    if (this.props.aircraftType) {
      searchTerms.child('type', this.props.aircraftType.toUpperCase().trim());
    }
    return searchTerms;
  }

  render() {
    const emptyMessage = 'Tippen Sie die ersten Buchstaben der Immatrikulation oder des Typs und wählen ' +
      'Sie das gewünschte Flugzeug anschliessend aus der Liste hier aus.';

    const searchTerms = this.buildSearchTerms();

    const itemComparator = (aircraft1, aircraft2) => aircraft1.key.localeCompare(aircraft2.key);

    return (
      <FilteredList
        className="AircraftList"
        emptyMessage={emptyMessage}
        searchTerms={searchTerms}
        itemComponentClass={AircraftItem}
        firebaseUri={Config.firebaseUrl + '/aircrafts/'}
        itemComparator={itemComparator}
        onClick={this.props.onClick}
      />
    );
  }
}

AircraftList.propTypes = {
  immatriculation: PropTypes.string,
  aircraftType: PropTypes.string,
  onClick: PropTypes.func,
};

export default AircraftList;
