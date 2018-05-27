const login = (admin = false) => {
  cy.request('POST', 'https://us-central1-cypress-testing.cloudfunctions.net/auth', {
    mode: 'flightnet',
    username: 'foo',
    password: 'bar'
  }).then((response) => {
    cy.window().then(win => {
      win.firebase.getRef('/admins/foo').set(admin).then(() => {
        win.firebase.authenticate(response.body.token);
      });
    })
  });
};

Cypress.Commands.add('login', login);

Cypress.Commands.add('loginAdmin', () => login(true));

Cypress.Commands.add('logout', () => {
  cy.window().then(win => {
    win.firebase.unauth();
  })
});
