const login = (username, password) => {
  cy.request('POST', 'https://europe-west1-cypress-testing.cloudfunctions.net/auth', {
    mode: 'static',
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

Cypress.Commands.add('loginEmail', () => {
  cy.request('POST', 'https://europe-west1-cypress-testing.cloudfunctions.net/createTestEmailToken')
    .then((response) => {
      cy.window().then(win => {
        return win.firebase.authenticate(response.body.token);
      });
    });
});

Cypress.Commands.add('logout', () => {
  cy.window().then(win => {
    win.firebase.unauth();
  })
});

// Removes every child under `path` individually. The security rules grant write
// access at `/departures/$id` (not at the `/departures` parent), so the whole
// collection cannot be cleared in a single remove() — each movement must go on
// its own. Must run while authenticated as admin and after lockDate is cleared.
const removeAllChildren = (win, path) =>
  win.firebase.getRef(path).once('value').then(snapshot => {
    const val = snapshot.val();
    if (!val) {
      return undefined;
    }
    return Promise.all(
      Object.keys(val).map(key => win.firebase.getRef(`${path}/${key}`).remove())
    );
  });

// Resets the shared cypress-testing database to a clean movement state so an
// interrupted run cannot wedge later runs. A leftover /settings/lockDate blocks
// both writing AND deleting movements (see firebase-rules-template.json), which
// is why it is cleared first — otherwise the movement deletes below would be
// denied. Deleting the movements triggers onDelete, which clears the matching
// /movementAssociations records (that path is .write:false for clients).
Cypress.Commands.add('resetMovementsTestData', () => {
  cy.window().then(win =>
    win.firebase.getRef('/settings/lockDate').remove()
      .then(() => removeAllChildren(win, '/departures'))
      .then(() => removeAllChildren(win, '/arrivals'))
  );
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
