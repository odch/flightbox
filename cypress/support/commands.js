Cypress.Commands.add('login', () => {
  cy.request('POST', 'https://us-central1-cypress-testing.cloudfunctions.net/auth', {
    mode: 'flightnet',
    username: 'foo',
    password: 'bar'
  }).then((response) => {
    cy.window().then(win => {
      win.firebase.authenticate(response.body.token);
    })
  });
});

Cypress.Commands.add('logout', () => {
  cy.window().then(win => {
    win.firebase.unauth();
  })
});
