import moment from 'moment';
import { firebaseToLocal } from '../../../../src/util/movements';

function expectLastOfMonth(date) {
  expect(date).to.equal(moment(date).endOf('month').format('YYYY-MM-DD'));
}

function expectMinutes(time, expectedMinutes) {
  const groups = time.match(/^([0-2][0-9]):([0-5][0-9])$/);
  const actualMinutes = parseInt(groups[2]);
  expect(expectedMinutes).to.include(actualMinutes);
}

describe('movements', () => {
  describe('departure', () => {
    describe('create_departure', () => {
      before(() => {
        cy.visit('#/departure/new');
        cy.login();
      });

      after(() => {
        cy.logout();

        cy.window().then(win => {
          win.firebase.getRef('/departures').remove();
        })
      });

      it('creates a new departure', () => {
        cy.get(`[data-cy=immatriculation]`).type('HBKOF');
        cy.get(`[data-cy=aircraftType]`).type('DR40');
        cy.get(`[data-cy=mtow]`).type('1000');
        cy.get(`[data-cy=next-button]`).click();

        cy.get(`[data-cy=memberNr]`).type('99999');
        cy.get(`[data-cy=phone]`).type('0791234567');
        cy.get(`[data-cy=lastname]`).type('Muster');
        cy.get(`[data-cy=firstname]`).type('Max');
        cy.get(`[data-cy=next-button]`).click();

        cy.get(`[data-cy=passengerCount-increment]`).click();
        cy.get(`[data-cy=carriageVoucher-yes]`).click();
        cy.get(`[data-cy=next-button]`).click();

        cy.get(`[data-cy=date]`).click();
        cy.get(`.DayPicker-Day[aria-disabled=false]`).last().click(); // select last day of month
        cy.get(`[data-cy=time-minutes-increment]`).click();
        cy.get(`[data-cy=location]`).type('LSZR');
        cy.get(`[data-cy=duration-hours-increment]`).click();
        cy.get(`[data-cy=duration-minutes-increment]`).click();
        cy.get(`[data-cy=next-button]`).click();
        cy.get(`[data-cy=location-confirmation-dialog-confirm]`).click();

        cy.get(`[data-cy=flightType-private]`).click();
        cy.get(`[data-cy=runway-36]`).click();
        cy.get(`[data-cy=departureRoute-west]`).click();
        cy.get(`[data-cy=route]`).type('Säntis Churfirsten Rheintal');
        cy.get(`[data-cy=remarks]`).type('Komme erst morgen zurück');
        cy.get(`[data-cy=next-button]`).click();
        cy.get(`[data-cy=commit-requirement-dialog-confirm]`).click();

        cy.get(`[data-cy=finish-button]`).click();
        cy.hash().should('eq', '#/');

        cy.window().then(win => win.firebase.getRef('/departures').once('value').then(snapshot => {
          const departures = snapshot.val();

          const keys = Object.keys(departures);
          expect(keys.length).to.equal(1);

          const movement = firebaseToLocal(departures[keys[0]]);

          // we selected the last day of the month
          expectLastOfMonth(movement.date);

          // default time is rounded to quarter of an hour and we clicked once on the minutes increment button
          expectMinutes(movement.time, [1, 16, 31, 46]);

          expect(movement.aircraftType).to.equal('DR40');
          expect(movement.carriageVoucher).to.equal('yes');
          expect(movement.departureRoute).to.equal('west');
          expect(movement.duration).to.equal('01:01');
          expect(movement.firstname).to.equal('Max');
          expect(movement.flightType).to.equal('private');
          expect(movement.immatriculation).to.equal('HBKOF');
          expect(movement.lastname).to.equal('Muster');
          expect(movement.location).to.equal('LSZR');
          expect(movement.memberNr).to.equal('99999');
          expect(movement.mtow).to.equal(1000);
          expect(movement.location).to.equal('LSZR');
          expect(movement.passengerCount).to.equal(1);
          expect(movement.phone).to.equal('0791234567');
          expect(movement.remarks).to.equal('Komme erst morgen zurück');
          expect(movement.route).to.equal('Säntis Churfirsten Rheintal');
          expect(movement.runway).to.equal('36');
        }));
      });
    });
  });
});
