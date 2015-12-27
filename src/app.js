import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, IndexRoute } from 'react-router';

import App from './components/App';
import StartPage from './components/StartPage';
import DeparturePage from './components/DeparturePage';
import ArrivalPage from './components/ArrivalPage';
import MovementsPage from './components/MovementsPage';

ReactDOM.render((
  <Router>
    <Route path="/" handler={App}>
      <IndexRoute component={StartPage}/>
      <Route path="departure/new" component={DeparturePage}/>
      <Route path="departure/:key" component={DeparturePage}/>
      <Route path="arrival/new" component={ArrivalPage}/>
      <Route path="arrival/:key" component={ArrivalPage}/>
      <Route path="movements" component={MovementsPage}/>
    </Route>
  </Router>
), document.getElementById('app'));
