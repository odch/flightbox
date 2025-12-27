const login = (username, password) => {
  cy.request('POST', 'https://us-central1-cypress-testing.cloudfunctions.net/auth', {
    mode: 'flightnet',
    username,
    password
  }).then((response) => {
    cy.window().then(win => {
      win.firebase.authenticate(response.body.token);
    })
  });
};

Cypress.Commands.add('login', () => login('foo', 'bar'));

Cypress.Commands.add('loginAdmin', () => login('admin', '12345'));

Cypress.Commands.add('logout', () => {
  cy.window().then(win => {
    win.firebase.unauth();
  })
});
