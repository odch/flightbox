import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, IndexRoute } from 'react-router';

import App from './components/App';
import StartPage from './components/StartPage';
import DeparturePage from './components/DeparturePage';
import ArrivalPage from './components/ArrivalPage';
import MovementsPage from './components/MovementsPage';
import AdminPage from './components/AdminPage';

ReactDOM.render((
  <Router>
    <Route path="/" handler={App}>
      <IndexRoute component={StartPage}/>
      <Route path="departure/new" component={DeparturePage}/>
      <Route path="departure/new/:arrivalKey" component={DeparturePage}/>
      <Route path="departure/:key" component={DeparturePage}/>
      <Route path="arrival/new" component={ArrivalPage}/>
      <Route path="arrival/new/:departureKey" component={ArrivalPage}/>
      <Route path="arrival/:key" component={ArrivalPage}/>
      <Route path="movements" component={MovementsPage}/>
      <Route path="admin" component={AdminPage}/>
    </Route>
  </Router>
), document.getElementById('app'));
