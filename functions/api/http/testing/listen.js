'use strict';

// Starts `app` on a free local port for specs; `request` wraps fetch.
async function listen(app) {
  const server = await new Promise(resolve => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  return {
    request: (path, init) => fetch(`${baseUrl}${path}`, init),
    close: () =>
      new Promise(resolve => {
        server.closeAllConnections();
        server.close(resolve);
      }),
  };
}

module.exports = { listen };
