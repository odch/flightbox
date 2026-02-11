import '../reset.css';
import React from 'react';
import ReactDOM from 'react-dom';
import {Route, Router} from 'react-router-dom';
import {Provider} from 'react-redux';
import {applyMiddleware, compose, createStore} from 'redux';
import createSagaMiddleware from 'redux-saga';
import {ThemeProvider} from 'styled-components';
import moment from 'moment';

import 'moment/locale/de';

import {history} from './history'
import reducer, {sagas} from './modules';
import autoRestart from './util/autoRestartSaga';

import App from './containers/AppContainer';

import GlobalStyle from './style/global-style';

import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://8a606d82aa68850021fbfac2ffda30b5@o4509293310967808.ingest.de.sentry.io/4509293314113617",
  sendDefaultPii: true
});

const theme = require('../theme/' + __THEME__);

const sagaMiddleware = createSagaMiddleware();

let middleware = applyMiddleware(sagaMiddleware);

if (window.__REDUX_DEVTOOLS_EXTENSION__) {
  middleware = compose(middleware, window.__REDUX_DEVTOOLS_EXTENSION__({ trace: true }));
}

const store = createStore(reducer(history), middleware);

sagaMiddleware.run(autoRestart(sagas));

ReactDOM.render((
  <Provider store={store}>
    <GlobalStyle/>
    <ThemeProvider theme={theme}>
      <Router history={history}>
        <Route component={App}/>
      </Router>
    </ThemeProvider>
  </Provider>
), document.getElementById('app'));

setTimeout(
  () => window.location.reload(),
  moment('24:00:00', 'hh:mm:ss').diff(moment(), 'milliseconds')
);
