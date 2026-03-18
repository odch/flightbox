import '../reset.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import {Route, Router} from 'react-router-dom';
import {Provider} from 'react-redux';
import {applyMiddleware, compose, createStore} from 'redux';
import createSagaMiddleware from 'redux-saga';
import {ThemeProvider} from 'styled-components';
import moment from 'moment';

import 'moment/locale/de-ch';
import './i18n';

moment.locale('de-ch');

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

let middleware: any = applyMiddleware(sagaMiddleware);

if ((window as any).__REDUX_DEVTOOLS_EXTENSION__) {
  middleware = compose(middleware, (window as any).__REDUX_DEVTOOLS_EXTENSION__({ trace: true }));
}

const store = createStore((reducer as any)(history), middleware);

sagaMiddleware.run(autoRestart(sagas));

createRoot(document.getElementById('app')!).render(
  <Provider store={store}>
    <GlobalStyle/>
    <ThemeProvider theme={theme}>
      <Router history={history}>
        <Route component={App}/>
      </Router>
    </ThemeProvider>
  </Provider>
);

setTimeout(
  () => window.location.reload(),
  moment('24:00:00', 'hh:mm:ss').diff(moment(), 'milliseconds')
);

if (!__DEV__ && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then(registration => {
      setInterval(() => {
        registration.update().catch(() => {});
      }, 3 * 60 * 1000);
    }).catch(err => {
      console.error('SW registration failed', err);
    });
  });

  let hasController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hasController) {
      window.location.reload();
    }
    hasController = true;
  });
}
