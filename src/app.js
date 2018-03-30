import React from 'react';
import ReactDOM from 'react-dom';
import { Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware, compose } from 'redux';
import createHistory from 'history/createHashHistory';
import { ConnectedRouter, routerMiddleware } from 'react-router-redux';
import createSagaMiddleware from 'redux-saga';
import { ThemeProvider } from 'styled-components';
import moment from 'moment';

import 'moment/locale/de';

import reducer, { sagas } from './modules';
import autoRestart from './util/autoRestartSaga';

import App from './containers/AppContainer';

import './style/global-style';

const theme = require('../theme/' + __THEME__);

const sagaMiddleware = createSagaMiddleware();

const history = createHistory();
const reduxRouterMiddleware = routerMiddleware(history);

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
      <ConnectedRouter history={history}>
        <Route component={App}/>
      </ConnectedRouter>
    </ThemeProvider>
  </Provider>
), document.getElementById('app'));

setTimeout(
  () => window.location.reload(),
  moment('24:00:00', 'hh:mm:ss').diff(moment(), 'milliseconds')
);
