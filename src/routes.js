import React from 'react';
import Router from 'react-routing/src/Router';
import App from './components/App';
import StartPage from './components/StartPage';
import NotFoundPage from './components/NotFoundPage';
import ErrorPage from './components/ErrorPage';

const router = new Router(on => {
  on('*', async (state, next) => {
    const component = await next();
    return component && <App context={state.context}>{component}</App>;
  });

  on('/', async () => <StartPage />);

  on('error', (state, error) => state.statusCode === 404 ?
    <App context={state.context} error={error}><NotFoundPage context={state.context} /></App> :
    <App context={state.context} error={error}><ErrorPage context={state.context} /></App>
  );
});

export default router;
