describe('movements', () => {
  describe('email user movement list', () => {
    let createdDepartureKey;

    before(() => {
      cy.visit('#/departure/new');
      cy.loginEmail();
    });

    after(() => {
      // Clean up as admin (email user may lack delete permission)
      cy.logout();
      cy.loginAdmin();

      if (createdDepartureKey) {
        cy.window().then(win => {
          win.firebase.getRef(`/departures/${createdDepartureKey}`).remove();
        });
      }

      cy.logout();
    });

    it('shows departure in movement list for email user', () => {
      // Create a departure via the UI
      cy.get(`[data-cy=immatriculation]`).type('HBKOF');
      cy.get(`[data-cy=aircraftType]`).type('DR40');
      cy.get(`[data-cy=mtow]`).type('1000');
      cy.get(`[data-cy=aircraftCategory]`).click();
      cy.get(`[data-cy=aircraftCategory-option-Flugzeug]`).click();
      cy.get(`[data-cy=next-button]`).click();

      cy.get(`[data-cy=lastname]`).type('Cypress');
      cy.get(`[data-cy=firstname]`).type('Pilot');
      cy.get(`[data-cy=email]`).type('pilot@example.com');
      cy.get(`[data-cy=phone]`).type('0790000000');
      cy.get(`[data-cy=next-button]`).click();

      cy.get(`[data-cy=passengerCount-increment]`).click();
      cy.get(`[data-cy=carriageVoucher-yes]`).click();
      cy.get(`[data-cy=next-button]`).click();

      cy.get(`[data-cy=date]`).click();
      cy.get(`.DayPicker-Day[aria-disabled=false]`).last().click();
      cy.get(`[data-cy=time-minutes-increment]`).click();
      cy.get(`[data-cy=location]`).type('LSZR');
      cy.get(`[data-cy=duration-hours-increment]`).click();
      cy.get(`[data-cy=duration-minutes-increment]`).click();
      cy.get(`[data-cy=next-button]`).click();
      cy.get(`[data-cy=location-confirmation-dialog-confirm]`).click();

      cy.get(`[data-cy=flightType-private]`).click();
      cy.get(`[data-cy=runway-36]`).click();
      cy.get(`[data-cy=departureRoute-west]`).click();
      cy.get(`[data-cy=route]`).type('Testroute');
      cy.get(`[data-cy=remarks]`).type('E2E email user test');
      cy.get(`[data-cy=next-button]`).click();
      cy.get(`[data-cy=commit-requirement-dialog-confirm]`).click();

      cy.get(`[data-cy=finish-button]`).click();
      cy.hash().should('eq', '#/');

      // Navigate to movement list and verify exactly one departure appears
      cy.visit('#/movements');
      cy.get('[data-id]').should('have.length', 1);
      cy.get('[data-id]')
        .contains('HBKOF')
        .closest('[data-id]')
        .invoke('attr', 'data-id')
        .then(key => {
          createdDepartureKey = key;
        });
    });
  });
});
