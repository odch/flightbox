import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, IndexRoute, hashHistory } from 'react-router';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware, compose } from 'redux';
import { routerMiddleware } from 'react-router-redux';
import createSagaMiddleware from 'redux-saga';
import { ThemeProvider, withTheme } from 'styled-components';

import 'moment/locale/de';

import reducer, { sagas } from './modules';
import autoRestart from './util/autoRestartSaga';

import App from './containers/AppContainer';
import StartPage from './containers/StartPageContainer';
import DeparturePage from './containers/DeparturePageContainer';
import ArrivalPage from './containers/ArrivalPageContainer';
import MovementsPage from './containers/MovementsPageContainer';
import AdminPage from './containers/AdminPageContainer';
import MessagePage from './containers/MessagePageContainer';
import HelpPage from './containers/HelpPageContainer';

import './style/global-style';

const theme = require('../theme/' + __THEME__);

const sagaMiddleware = createSagaMiddleware();
const reduxRouterMiddleware = routerMiddleware(hashHistory);

let middleware = applyMiddleware(sagaMiddleware, reduxRouterMiddleware);

if (window.devToolsExtension) {
  middleware = compose(middleware, window.devToolsExtension());
}

const store = createStore(reducer, {}, middleware);

sagaMiddleware.run(autoRestart(sagas));

const handleRouteChange = (prevState, nextState) => {
  if (nextState.location.action !== 'POP') {
    window.scrollTo(0, 0);
  }
};

ReactDOM.render((
  <Provider store={store}>
    <ThemeProvider theme={theme}>
      <Router history={hashHistory}>
        <Route path="/" component={App} onChange={handleRouteChange}>
          <IndexRoute component={StartPage}/>
          <Route path="departure/new" component={DeparturePage}/>
          <Route path="departure/new/:arrivalKey" component={DeparturePage}/>
          <Route path="departure/:key" component={DeparturePage}/>
          <Route path="arrival/new" component={ArrivalPage}/>
          <Route path="arrival/new/:departureKey" component={ArrivalPage}/>
          <Route path="arrival/:key" component={ArrivalPage}/>
          <Route path="movements" component={MovementsPage}/>
          <Route path="admin" component={AdminPage}/>
          <Route path="message" component={MessagePage}/>
          <Route path="help" component={HelpPage}/>
        </Route>
      </Router>
    </ThemeProvider>
  </Provider>
), document.getElementById('app'));
