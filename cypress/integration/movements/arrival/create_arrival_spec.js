import moment from 'moment';
import {firebaseToLocal} from '../../../../src/util/movements';

function expectLastOfMonth(date) {
  expect(date).to.equal(moment(date).endOf('month').format('YYYY-MM-DD'));
}

function expectMinutes(time, expectedMinutes) {
  const groups = time.match(/^([0-2][0-9]):([0-5][0-9])$/);
  const actualMinutes = parseInt(groups[2]);
  expect(expectedMinutes).to.include(actualMinutes);
}

describe('movements', () => {
  describe('arrival', () => {
    describe('create_arrival', () => {
      let createdArrivalKey;

      before(() => {
        cy.visit('#/arrival/new');
        cy.login();
      });

      after(() => {
        if (createdArrivalKey) {
          cy.window().then(win => {
            win.firebase.getRef(`/arrivals/${createdArrivalKey}`).remove();
          });
        }

        cy.logout();
      });

      it('creates a new arrival', () => {
        cy.get(`[data-cy=immatriculation]`).type('HBKOF');
        cy.get(`[data-cy=aircraftType]`).type('DR40');
        cy.get(`[data-cy=mtow]`).type('1000');
        cy.get(`[data-cy=aircraftCategory]`).click();
        cy.get(`[data-cy=aircraftCategory-option-Flugzeug]`).click();
        cy.get(`[data-cy=next-button]`).click();

        cy.get(`[data-cy=lastname]`).type('Muster');
        cy.get(`[data-cy=firstname]`).type('Max');
        cy.get(`[data-cy=email]`).type('max@example.com');
        cy.get(`[data-cy=phone]`).type('0791234567');
        cy.get(`[data-cy=next-button]`).click();

        cy.get(`[data-cy=passengerCount-increment]`).click();
        cy.get(`[data-cy=next-button]`).click();

        cy.get(`[data-cy=date]`).click();
        cy.get(`.DayPicker-Day[aria-disabled=false]`).last().click();
        cy.get(`[data-cy=time-minutes-increment]`).click();
        cy.get(`[data-cy=location]`).type('LSZR');
        cy.get(`[data-cy=landingCount-increment]`).click();
        cy.get(`[data-cy=next-button]`).click();
        cy.get(`[data-cy=location-confirmation-dialog-confirm]`).click();

        cy.get(`[data-cy=flightType-private]`).click();
        cy.get(`[data-cy=runway-36]`).click();
        cy.get(`[data-cy=arrivalRoute-west]`).click();
        cy.get(`[data-cy=remarks]`).type('Testankunft');
        cy.get(`[data-cy=next-button]`).click();

        cy.get(`[data-cy=finish-button]`).click();
        cy.hash().should('eq', '#/');

        cy.window().then(win => win.firebase.getRef('/arrivals').once('value').then(snapshot => {
          const arrivals = snapshot.val();

          const keys = Object.keys(arrivals);
          expect(keys.length).to.equal(1);

          createdArrivalKey = keys[0];

          const movement = firebaseToLocal(arrivals[createdArrivalKey]);

          expectLastOfMonth(movement.date);
          expectMinutes(movement.time, [1, 16, 31, 46]);

          expect(movement.aircraftType).to.equal('DR40');
          expect(movement.arrivalRoute).to.equal('west');
          expect(movement.firstname).to.equal('Max');
          expect(movement.flightType).to.equal('private');
          expect(movement.immatriculation).to.equal('HBKOF');
          expect(movement.landingCount).to.equal(1);
          expect(movement.lastname).to.equal('Muster');
          expect(movement.location).to.equal('LSZR');
          expect(movement.mtow).to.equal(1000);
          expect(movement.passengerCount).to.equal(1);
          expect(movement.phone).to.equal('0791234567');
          expect(movement.email).to.equal('max@example.com');
          expect(movement.remarks).to.equal('Testankunft');
          expect(movement.runway).to.equal('36');
        }));
      });
    });
  });
});
