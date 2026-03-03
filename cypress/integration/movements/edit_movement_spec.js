describe('movements', () => {
  describe('edit_movement', () => {
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
      location: 'LSZR',
      remarks: 'Original remark'
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

    it('edits remarks on an existing departure', () => {
      cy.viewport(1400, 900);
      cy.visit('#/movements');

      cy.then(() => {
        cy.get(`[data-id="${departureKey}"]`).should('exist');
        cy.get(`[data-id="${departureKey}"]`).find('.immatriculation').click();
        cy.get(`[data-cy=action-edit]`).first().click();
      });

      cy.hash().should('include', `/departure/${departureKey}`);

      // Page 1: AircraftPage
      cy.get(`[data-cy=next-button]`).click();
      // Page 2: PilotPage
      cy.get(`[data-cy=next-button]`).click();
      // Page 3: PassengerPage
      cy.get(`[data-cy=next-button]`).click();
      // Page 4: DepartureArrivalPage — confirm location dialog if it appears
      cy.get(`[data-cy=next-button]`).click();
      cy.get('body').then($body => {
        if ($body.find('[data-cy=location-confirmation-dialog-confirm]').length > 0) {
          cy.get(`[data-cy=location-confirmation-dialog-confirm]`).click();
        }
      });

      // Page 5: FlightPage — update remarks
      cy.get(`[data-cy=remarks]`).clear().type('Updated remark');
      cy.get(`[data-cy=next-button]`).click();

      // Wait for the finish page to confirm the save completed
      cy.get(`[data-cy=finish-button]`).should('be.visible');

      cy.window().then(win =>
        win.firebase.getRef(`/departures/${departureKey}`).once('value').then(snapshot => {
          const val = snapshot.val();
          expect(val.remarks).to.equal('Updated remark');
        })
      );
    });
  });
});
