const login = (username, password) => {
  cy.request('POST', 'https://europe-west1-cypress-testing.cloudfunctions.net/auth', {
    mode: 'flightnet',
    username,
    password
  }).then((response) => {
    cy.window().then(win => {
      return win.firebase.authenticate(response.body.token);
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

Cypress.Commands.add('waitForAssociation', (movementType, movementKey, expectedType) => {
  const path = `/movementAssociations/${movementType}s/${movementKey}`;
  const attempt = (retries) => {
    return cy.window().then(win =>
      win.firebase.getRef(path).once('value').then(snap => {
        const val = snap.val();
        if (val && val.type !== undefined) {
          const settled = expectedType ? val.type === expectedType : val.type !== 'none';
          if (settled) return val;
        }
        if (retries <= 0) throw new Error(`No association settled at ${path}`);
        return cy.wait(500).then(() => attempt(retries - 1));
      })
    );
  };
  return attempt(10); // poll up to 5s
});
