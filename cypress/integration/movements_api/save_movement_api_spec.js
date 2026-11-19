// Behaviour that only exists when the app saves movements through the app
// API (movementWritesViaApi). Runs in `npm run cy:test:api`, which builds
// the app from projects/cypress-testing-api.json and exposes the Cypress value
// movementWritesViaApi; skipped in the default run (direct database writes).
// The other movement specs run in both modes.

const describeWithApi = Cypress.expose('movementWritesViaApi') ? describe : describe.skip;

const CREATE_DEPARTURE = '**/api/app/movements/departures';
const UPDATE_DEPARTURE = '**/api/app/movements/departures/*';

const readDepartures = () =>
  cy.window().then(win =>
    win.firebase.getRef('/departures').once('value').then(snapshot => snapshot.val() || {})
  );

// After "next" on the departure/arrival page the wizard checks the location
// asynchronously; confirm the dialog if it shows up.
const confirmLocationIfAsked = () => {
  cy.get('[data-cy=location-confirmation-dialog-confirm], [data-cy=remarks]', {timeout: 8000})
    .then($els => {
      if ($els.filter('[data-cy=location-confirmation-dialog-confirm]').length > 0) {
        cy.get('[data-cy=location-confirmation-dialog-confirm]').click();
      }
    });
};

// Fills the new-departure wizard up to the commit dialog (not confirmed).
const fillNewDeparture = remarks => {
  cy.visit('#/departure/new');

  cy.get('[data-cy=immatriculation]').type('HBKOF');
  cy.get('[data-cy=aircraftType]').type('DR40');
  cy.get('[data-cy=mtow]').type('1000');
  cy.get('[data-cy=aircraftCategory]').click();
  cy.get('[data-cy=aircraftCategory-option-Flugzeug]').click();
  cy.get('[data-cy=next-button]').click();

  cy.get('[data-cy=lastname]').type('Muster');
  cy.get('[data-cy=firstname]').type('Max');
  cy.get('[data-cy=email]').type('max@example.com');
  cy.get('[data-cy=phone]').type('0791234567');
  cy.get('[data-cy=next-button]').click();

  cy.get('[data-cy=next-button]').click();

  cy.get('[data-cy=location]').type('LSZR');
  cy.get('[data-cy=duration-hours-increment]').click();
  cy.get('[data-cy=next-button]').click();
  confirmLocationIfAsked();

  cy.get('[data-cy=flightType-private]').click();
  cy.get('[data-cy=runway-36]').click();
  cy.get('[data-cy=departureRoute-west]').click();
  cy.get('[data-cy=remarks]').type(remarks);
  cy.get('[data-cy=next-button]').click();
};

describeWithApi('movements_api', () => {
  describe('save_movement_api', () => {
    beforeEach(() => {
      cy.visit('#/');
      cy.loginAdmin();
      cy.resetMovementsTestData();
      cy.logout();
      cy.login();
    });

    afterEach(() => {
      cy.logout();
    });

    it('creates and edits a departure through the API, not the database', () => {
      cy.intercept('POST', CREATE_DEPARTURE).as('create');
      cy.intercept('PATCH', UPDATE_DEPARTURE).as('update');

      fillNewDeparture('Created via API');
      cy.get('[data-cy=commit-requirement-dialog-confirm]').click();

      cy.wait('@create').then(({request, response}) => {
        expect(request.headers.authorization).to.match(/^Bearer \S+$/);
        expect(response.statusCode).to.equal(201);
        expect(response.body.key).to.be.a('string');
        cy.wrap(response.body.key).as('key');
      });
      cy.get('[data-cy=finish-button]').should('be.visible');

      cy.get('@key').then(key => readDepartures().then(departures => {
        expect(Object.keys(departures)).to.deep.equal([key]);
        const stored = departures[key];
        expect(stored.remarks).to.equal('Created via API');
        // Set by the server, derived from dateTime
        expect(stored.negativeTimestamp).to.equal(-Date.parse(stored.dateTime));
        // The static Cypress login has no e-mail, so the movement may be
        // ownerless; the order key exists exactly when createdBy does.
        if (stored.createdBy) {
          expect(stored.createdBy_orderKey.startsWith(`${stored.createdBy}_`)).to.equal(true);
        } else {
          expect(stored).not.to.have.property('createdBy_orderKey');
        }
      }));

      // Edit it from the movement list as admin, like edit_movement_spec
      cy.logout();
      cy.loginAdmin();
      cy.viewport(1400, 900);
      cy.visit('#/movements');
      cy.get('@key').then(key => {
        cy.get(`[data-id="${key}"]`).find('.immatriculation').click();
        cy.get('[data-cy=action-edit]').first().click();
        cy.hash().should('include', `/departure/${key}`);
      });
      cy.get('[data-cy=next-button]').click();
      cy.get('[data-cy=next-button]').click();
      cy.get('[data-cy=next-button]').click();
      cy.get('[data-cy=next-button]').click();
      confirmLocationIfAsked();
      cy.get('[data-cy=remarks]').clear().type('Edited via API');
      cy.get('[data-cy=next-button]').click();
      cy.get('[data-cy=commit-requirement-dialog-confirm], [data-cy=finish-button]')
        .then($els => {
          if ($els.filter('[data-cy=commit-requirement-dialog-confirm]').length > 0) {
            cy.get('[data-cy=commit-requirement-dialog-confirm]').click();
          }
        });

      cy.wait('@update').its('response.statusCode').should('equal', 200);
      cy.get('[data-cy=finish-button]').should('be.visible');

      cy.get('@key').then(key => readDepartures().then(departures => {
        expect(departures[key].remarks).to.equal('Edited via API');
      }));
    });

    it('shows the validation error of the API and stores nothing', () => {
      // The forms only offer valid values, so the request is altered on its
      // way to the real API, which rejects the unknown runway.
      cy.intercept('POST', CREATE_DEPARTURE, req => {
        req.body = {...req.body, runway: '99'};
      }).as('create');

      fillNewDeparture('Rejected by the API');
      cy.get('[data-cy=commit-requirement-dialog-confirm]').click();

      cy.wait('@create').then(({response}) => {
        expect(response.statusCode).to.equal(400);
        expect(response.body.error.code).to.equal('invalid-argument');
        expect(response.body.error.details.validationErrors)
          .to.deep.include({field: 'runway', reason: 'not-allowed'});
      });
      cy.contains('Validation failed: runway').should('be.visible');
      cy.get('[data-cy=finish-button]').should('not.exist');

      readDepartures().then(departures => {
        expect(departures).to.deep.equal({});
      });
    });

    it('saves a new departure only once on a double click', () => {
      // Slow the answer down so the second click lands while the first
      // save is still running.
      cy.intercept('POST', CREATE_DEPARTURE, req => {
        req.on('response', res => {
          res.setDelay(1500);
        });
      }).as('create');

      fillNewDeparture('Double click');
      cy.get('[data-cy=commit-requirement-dialog-confirm]').dblclick();

      cy.wait('@create');
      cy.get('[data-cy=finish-button]').should('be.visible');
      // Leave time for a second request to show up, then count
      cy.wait(2000);
      cy.get('@create.all').should('have.length', 1);

      readDepartures().then(departures => {
        expect(Object.keys(departures)).to.have.length(1);
      });
    });
  });
});
