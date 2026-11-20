'use strict';

const { toReadView, isOwnMovement, OPERATIONAL_FIELDS } = require('./readView');

const ARRIVAL = Object.freeze({
  dateTime: '2026-11-20T16:05:00.000Z',
  negativeTimestamp: -1795190700000,
  createdBy: 'pilot@example.com',
  createdBy_orderKey: 'pilot@example.com_8204809299999',
  firstname: 'Hans',
  lastname: 'Muster',
  email: 'pilot@example.com',
  phone: '+41 79 000 00 00',
  memberNr: '123',
  remarks: 'Bitte Hans anrufen',
  immatriculation: 'HBPIV',
  aircraftType: 'P28A',
  aircraftCategory: 'Flugzeug',
  mtow: 1157,
  flightType: 'private',
  location: 'LSZH',
  arrivalRoute: 'N',
  runway: '30',
  landingCount: 1,
  landingFeeSingle: 27.75,
  landingFeeTotal: 27.75,
  feeTotalNet: 27.75,
  feeVat: 2.25,
  feeRoundingDifference: 0,
  feeTotalGross: 30,
  aircraftDataSource: 'registry',
  paymentMethod: { method: 'invoice', invoiceRecipientName: 'Hans Muster', status: 'pending' },
  customsFormId: 'f1',
  customsFormUrl: 'https://customs.example.com/f1',
  privacyPolicyAcceptedAt: '2026-11-20T16:00:00.000Z',
  someFutureField: 'x',
});

describe('movement domain', () => {
  describe('readView', () => {
    it('gives the caller all fields of an own movement, without the index fields', () => {
      const { negativeTimestamp, createdBy_orderKey, ...rest } = ARRIVAL;
      expect(negativeTimestamp && createdBy_orderKey).toBeTruthy();
      expect(toReadView('arrival', 'k1', ARRIVAL, 'Pilot@Example.com'))
        .toEqual({ type: 'arrival', key: 'k1', own: true, ...rest });
    });

    it('gives only operational fields of the movements of others: no personal data', () => {
      const view = toReadView('arrival', 'k1', ARRIVAL, 'admin@example.com');
      expect(view).toEqual({
        type: 'arrival',
        key: 'k1',
        own: false,
        dateTime: '2026-11-20T16:05:00.000Z',
        immatriculation: 'HBPIV',
        aircraftType: 'P28A',
        aircraftCategory: 'Flugzeug',
        mtow: 1157,
        flightType: 'private',
        location: 'LSZH',
        arrivalRoute: 'N',
        runway: '30',
        landingCount: 1,
        landingFeeSingle: 27.75,
        landingFeeTotal: 27.75,
        feeTotalNet: 27.75,
        feeVat: 2.25,
        feeRoundingDifference: 0,
        feeTotalGross: 30,
        aircraftDataSource: 'registry',
        paymentMethod: { method: 'invoice', status: 'pending' },
      });
      const text = JSON.stringify(view);
      ['Hans', 'Muster', 'pilot@example.com', '+41', 'anrufen', 'customs', '123'].forEach(personal => {
        expect(text).not.toContain(personal);
      });
    });

    it('treats a movement without owner or a caller without e-mail as not own', () => {
      const { createdBy, ...ownerless } = ARRIVAL;
      expect(createdBy).toBeTruthy();
      expect(isOwnMovement(ownerless, 'pilot@example.com')).toBe(false);
      expect(isOwnMovement(ARRIVAL, null)).toBe(false);
      expect(toReadView('departure', 'k2', ownerless, null).firstname).toBeUndefined();
    });

    it('lists no personal field as operational', () => {
      ['firstname', 'lastname', 'email', 'phone', 'memberNr', 'remarks', 'route', 'createdBy', 'customsFormUrl']
        .forEach(field => expect(OPERATIONAL_FIELDS).not.toContain(field));
    });
  });
});
