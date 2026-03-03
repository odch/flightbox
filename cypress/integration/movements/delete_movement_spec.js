describe('movements', () => {
  describe('delete_movement', () => {
    let departureKey;

    const now = new Date();
    const dateTime = now.toISOString();

    const departure = {
      immatriculation: 'HBKOF',
      dateTime,
      negativeTimestamp: -now.getTime(),
      departureRoute: 'west',
      flightType: 'private',
      runway: '36',
      aircraftType: 'DR40',
      mtow: 1000,
      aircraftCategory: 'Flugzeug',
      duration: '01:00',
      email: 'test@example.com',
      firstname: 'Test',
      lastname: 'Pilot',
      location: 'LSZR'
    };

    before(() => {
      cy.visit('#/');
      cy.loginAdmin();
      cy.window().then(win =>
        win.firebase.getRef('/departures').push(departure).then(ref => {
          departureKey = ref.key;
        })
      );
    });

    after(() => {
      if (departureKey) {
        cy.window().then(win => {
          win.firebase.getRef(`/departures/${departureKey}`).remove();
        });
      }
      cy.logout();
    });

    it('deletes a departure via confirmation dialog', () => {
      cy.viewport(1400, 900);
      cy.visit('#/movements');

      cy.get(`[data-id="${departureKey}"]`).should('exist');
      cy.get(`[data-id="${departureKey}"]`).find('.immatriculation').click();
      cy.get(`[data-cy=action-delete]`).first().click();

      cy.get(`[data-cy=delete-confirm]`).should('be.visible').click();

      cy.get(`[data-id="${departureKey}"]`).should('not.exist');
    });
  });
});
