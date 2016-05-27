import React, { PropTypes, Component } from 'react';
import './AircraftList.scss';
import SearchTerms from '../../util/SearchTerms.js';
import FilteredList from '../FilteredList';
import AircraftItem from './AircraftItem.js';

class AircraftList extends Component {

  buildSearchTerms() {
    const searchTerms = new SearchTerms();
    if (this.props.immatriculation) {
      searchTerms.key(this.props.immatriculation.toUpperCase().trim(), ['HB', 'D', 'OE', 'I', 'F', 'N']);
    }
    return searchTerms;
  }

  render() {
    const emptyTitle = 'Flugzeug auswählen';
    const emptyMessage = this.props.emptyMessage ||
      'Tippen Sie die ersten Buchstaben der Immatrikulation und wählen ' +
      'Sie das gewünschte Flugzeug anschliessend aus der Liste hier aus.';

    const searchTerms = this.buildSearchTerms();

    const itemComparator = (aircraft1, aircraft2) => aircraft1.key.localeCompare(aircraft2.key);

    return (
      <FilteredList
        className="AircraftList"
        emptyTitle={emptyTitle}
        emptyMessage={emptyMessage}
        searchTerms={searchTerms}
        itemComponentClass={AircraftItem}
        firebaseUri="/aircrafts/"
        itemComparator={itemComparator}
        onClick={this.props.onClick}
      />
    );
  }
}

AircraftList.propTypes = {
  immatriculation: PropTypes.string,
  onClick: PropTypes.func,
  emptyMessage: PropTypes.string,
};

export default AircraftList;
