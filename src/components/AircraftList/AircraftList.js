import React, { PropTypes, Component } from 'react';
import './AircraftList.scss';
import SearchTerms from './SearchTerms.js';
import FirebaseList from './FirebaseList.js';
import Firebase from 'firebase';
import Config from 'Config';

class AircraftList extends Component {

  constructor(props) {
    super(props);
    this.state = {
      aircrafts: [],
    };
    this.firebaseRef = new Firebase(Config.firebaseUrl + '/aircrafts');
    this.firebaseList = new FirebaseList(
      this.firebaseRef,
      (aircraft1, aircraft2) => aircraft1.key.localeCompare(aircraft2.key)
    );
    this.onSearchResult = this.onSearchResult.bind(this);
  }

  componentWillMount() {
    this.firebaseList.addResultCallback(this.onSearchResult);
    this.initSearch(this.props);
  }

  componentWillUnmount() {
    this.firebaseList.removeResultCallback(this.onSearchResult);
  }

  componentWillReceiveProps(nextProps) {
    this.initSearch(nextProps);
  }

  onSearchResult(result) {
    this.setState({
      aircrafts: result.data,
    });
  }

  initSearch(props) {
    const terms = new SearchTerms();
    if (props.immatriculation) {
      terms.key(props.immatriculation.toUpperCase().trim(), ['HB', 'D', 'OE', 'I', 'F', 'N']);
    }
    if (props.aircraftType) {
      terms.child('type', props.aircraftType.toUpperCase().trim());
    }
    this.firebaseList.search(terms);
  }

  clickHandler(item) {
    if (typeof this.props.onClick === 'function') {
      this.props.onClick(item);
    }
  }

  render() {
    let content;

    if (this.state.aircrafts.length > 0) {
      content = (
        <ul>
          {this.state.aircrafts.map((item, index) => {
            return (
              <li key={index} onMouseDown={this.clickHandler.bind(this, item)}>
                <span className="immatriculation">{item.key}</span>
                <span className="type">{item.value.type}</span>
              </li>
            );
          })}
        </ul>
      );
    } else {
      content = (
        <div className="empty-message">
          <em>Keine Ergebnisse</em>
          <p>Tippen Sie die ersten Buchstaben der Immatrikulation oder des Typs und wählen
            Sie das gewünschte Flugzeug anschliessend aus der Liste hier aus.</p>
        </div>
      );
    }

    return (
      <div className="AircraftList">
        {content}
      </div>
    );
  }
}

AircraftList.propTypes = {
  immatriculation: PropTypes.string,
  aircraftType: PropTypes.string,
  onClick: PropTypes.func,
};

export default AircraftList;
