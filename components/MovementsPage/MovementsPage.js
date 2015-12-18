import React, { PropTypes, Component } from 'react';
import './MovementsPage.scss';
import MovementList from '../MovementList';
import TabPanel from '../TabPanel';
import VerticalHeaderPage from '../VerticalHeaderPage';

class MovementsPage extends Component {

  render() {
    const departuresList = <MovementList key="departures"
                                         className="departures"
                                         firebaseUri="https://mfgt-flights.firebaseio.com/departures/"
                                         onClick={this.departuresListClick.bind(this)}/>;
    const arrivalsList = <MovementList key="arrivals"
                                       className="arrivals"
                                       firebaseUri="https://mfgt-flights.firebaseio.com/arrivals/"
                                       onClick={this.arrivalsListClick.bind(this)}/>;
    const tabs = [{
      label: 'Abflüge',
      component: departuresList
    }, {
      label: 'Ankünfte',
      component: arrivalsList
    }];
    const tabPanel = <TabPanel tabs={tabs}/>;
    return (
      <VerticalHeaderPage className="MovementsPage" component={tabPanel}/>
    );
  }

  departuresListClick(item) {
    window.location.hash = '/departure/' + item.key;
  }

  arrivalsListClick(item) {
    window.location.hash = '/arrival/' + item.key;
  }
}

export default MovementsPage;
