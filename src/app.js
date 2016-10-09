import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, IndexRoute, hashHistory } from 'react-router';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware, compose } from 'redux';
import { routerMiddleware } from 'react-router-redux';
import createSagaMiddleware from 'redux-saga';
import reducer, { sagas } from './modules';

import App from './containers/AppContainer';
import StartPage from './containers/StartPageContainer';
import DeparturePage from './containers/DeparturePageContainer';
import ArrivalPage from './containers/ArrivalPageContainer';
import MovementsPage from './containers/MovementsPageContainer';
import AdminPage from './containers/AdminPageContainer';
import MessagePage from './containers/MessagePageContainer';
import HelpPage from './containers/HelpPageContainer';

const sagaMiddleware = createSagaMiddleware();
const reduxRouterMiddleware = routerMiddleware(hashHistory);

let middleware = applyMiddleware(sagaMiddleware, reduxRouterMiddleware);

if (__DEV__ && window.devToolsExtension) {
  middleware = compose(middleware, window.devToolsExtension());
}

const store = createStore(reducer, {}, middleware);

sagaMiddleware.run(sagas);

ReactDOM.render((
  <Provider store={store}>
    <Router history={hashHistory}>
      <Route path="/" component={App}>
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
  </Provider>
), document.getElementById('app'));
