// Parity: the payloads the client's saveMovement and
// saveMovementPaymentMethod sagas write today must pass the server-side
// movement domain (functions/movements/domain) unchanged, so switching a
// project to `movementWritesViaApi` does not reject anything the database
// rules accept. The server derives createdBy, negativeTimestamp and
// createdBy_orderKey itself; they must come out as the client computes them.
import * as sagas from './sagas';
import * as remote from './remote';
import {toOrderKey} from './pagination';
import {firebaseToLocal} from '../../util/movements';

const {prepareWrite, validateMovement, checkWriteAccess} = require('../../../functions/movements/domain');
const {toOrderKey: serverToOrderKey} = require('../../../functions/movements/domain/orderKey');
const {loadVariant} = require('../../../functions/movements/domain/testing/projectPolicies');

jest.mock('./remote');
jest.mock('firebase/database', () => ({
  onChildAdded: jest.fn(() => jest.fn()),
  onChildChanged: jest.fn(() => jest.fn()),
  onChildRemoved: jest.fn(() => jest.fn()),
}));

const {policy} = loadVariant('lsze');

const PILOT = {uid: 'pilot-uid', email: 'pilot@example.com', isAdmin: false};
const ADMIN = {uid: 'admin-uid', email: 'admin@example.com', isAdmin: true};
const KIOSK = {uid: 'kiosk', email: null, isAdmin: false};

// state.auth.data as the client holds it for these actors.
const clientAuth = actor => ({
  uid: actor.uid,
  email: actor.email || undefined,
  admin: actor.isAdmin,
  kiosk: actor.uid === 'kiosk' || undefined,
});

const PRIVACY_POLICY_URL = 'https://example.com/privacy';

// Runs the saveMovement saga with the wizard values and returns the
// arguments of its remote.saveMovement call.
function clientSave(values, actor) {
  const generator = sagas.saveMovement();
  generator.next();
  generator.next(values);
  let effect = generator.next(clientAuth(actor)).value;
  if (effect.type === 'SELECT') {
    effect = generator.next(PRIVACY_POLICY_URL).value;
  }
  expect(effect.type).toBe('CALL');
  expect(effect.payload.fn).toBe(remote.saveMovement);
  const [path, key, movement] = effect.payload.args;
  return {path, key, movement};
}

function clientSavePaymentMethod(key, paymentMethod) {
  const generator = sagas.saveMovementPaymentMethod({payload: {movementType: 'arrival', key, paymentMethod}});
  const effect = generator.next().value;
  expect(effect.payload.fn).toBe(remote.saveMovement);
  const [path, savedKey, movement] = effect.payload.args;
  return {path, key: savedKey, movement};
}

const TYPES = {'/departures': 'departure', '/arrivals': 'arrival'};

function serverDecision({path, movement: input}, actor, existing = null) {
  const type = TYPES[path];
  const prepared = prepareWrite({type, actor, existing, input});
  return {
    prepared,
    errors: validateMovement(type, prepared.movement, policy, {writtenFields: prepared.writtenFields}),
    access: checkWriteAccess({actor, existing, next: prepared.movement, policy, settings: {}}),
  };
}

const departureValues = overrides => ({
  type: 'departure',
  date: '2026-06-16',
  time: '12:15',
  immatriculation: 'HBKOF',
  aircraftType: 'C172',
  mtow: 1090,
  aircraftCategory: 'Flugzeug',
  memberNr: '1234',
  lastname: 'Muster',
  firstname: 'Max',
  email: 'pilot@example.com',
  phone: '+41 79 000 00 00',
  passengerCount: 2,
  carriageVoucher: 'yes',
  location: 'LSZH',
  duration: '01:30',
  runway: '30',
  departureRoute: 'W',
  route: 'via Sargans',
  flightType: 'private',
  remarks: 'Testflug',
  ...overrides,
});

const arrivalValues = overrides => ({
  type: 'arrival',
  date: '2026-06-16',
  time: '15:45',
  immatriculation: 'HBKOF',
  aircraftType: 'C172',
  mtow: 1090,
  aircraftCategory: 'Flugzeug',
  lastname: 'Muster',
  firstname: 'Max',
  email: 'pilot@example.com',
  phone: '+41 79 000 00 00',
  passengerCount: 0,
  location: 'LSZE',
  landingCount: 2,
  landingFeeSingle: 20,
  landingFeeCode: 'prod_123',
  landingFeeTotal: 40,
  goAroundCount: 1,
  goAroundFeeSingle: 10,
  goAroundFeeCode: 'prod_456',
  goAroundFeeTotal: 10,
  feeTotalNet: 46.27,
  feeVat: 3.73,
  feeRoundingDifference: 0,
  feeTotalGross: 50,
  runway: '12',
  arrivalRoute: 'circuits',
  flightType: 'instruction',
  ...overrides,
});

// The wizard values for editing a stored movement (initWizard).
const editValues = (stored, key, type) => ({...firebaseToLocal(stored), key, type});

describe('modules', () => {
  describe('movements', () => {
    describe('client payloads through the server movement domain', () => {
      it('accepts a new departure of a pilot and derives the same server-owned fields', () => {
        const saved = clientSave(departureValues(), PILOT);
        expect(saved.key).toBeUndefined();
        expect(saved.movement.createdBy).toBe(PILOT.email);
        expect(saved.movement.privacyPolicyAcceptedAt).toEqual(expect.any(String));

        const {prepared, errors, access} = serverDecision(saved, PILOT);
        expect(errors).toEqual([]);
        expect(access).toEqual({ok: true});
        expect(prepared.movement).toEqual(saved.movement);
      });

      it('accepts a new arrival with fees and circuits recorded at the kiosk (ownerless)', () => {
        const saved = clientSave(arrivalValues(), KIOSK);
        expect(saved.movement).not.toHaveProperty('createdBy');

        const {prepared, errors, access} = serverDecision(saved, KIOSK);
        expect(errors).toEqual([]);
        expect(access).toEqual({ok: true});
        expect(prepared.movement).toEqual(saved.movement);
      });

      it('accepts a new departure without passengers and without optional fields', () => {
        const values = departureValues({passengerCount: 0, carriageVoucher: undefined});
        ['memberNr', 'phone', 'route', 'remarks', 'runway', 'carriageVoucher'].forEach(field => delete values[field]);
        const saved = clientSave(values, PILOT);

        const {prepared, errors, access} = serverDecision(saved, PILOT);
        expect(errors).toEqual([]);
        expect(access).toEqual({ok: true});
        expect(prepared.movement).toEqual(saved.movement);
      });

      it('accepts a pilot editing their departure and derives the same fields', () => {
        const created = clientSave(departureValues(), PILOT).movement;
        const values = {...editValues(created, 'dep-1', 'departure'), time: '13:00', remarks: 'verschoben'};
        values.associatedMovement = {type: 'arrival', key: 'arr-1'};
        const saved = clientSave(values, PILOT);
        expect(saved.key).toBe('dep-1');

        const {prepared, errors, access} = serverDecision(saved, PILOT, created);
        expect(errors).toEqual([]);
        expect(access).toEqual({ok: true});
        expect(prepared.movement).toEqual({...created, ...saved.movement});
        expect(prepared.patch.negativeTimestamp).toBe(saved.movement.negativeTimestamp);
        expect(prepared.patch.createdBy_orderKey).toBe(saved.movement.createdBy_orderKey);
      });

      it('accepts an admin editing a pilot arrival without taking it over', () => {
        const created = clientSave(arrivalValues({arrivalRoute: 'N', location: 'LSZR'}), PILOT).movement;
        const saved = clientSave({...editValues(created, 'arr-1', 'arrival'), landingCount: 3}, ADMIN);

        const {prepared, errors, access} = serverDecision(saved, ADMIN, created);
        expect(errors).toEqual([]);
        expect(access).toEqual({ok: true});
        expect(prepared.movement.createdBy).toBe(PILOT.email);
        expect(prepared.movement).toEqual({...created, ...saved.movement});
      });

      it.each([
        ['cash', {method: 'cash'}],
        ['card at the kiosk terminal', {method: 'card_external'}],
        ['invoice', {method: 'invoice', invoiceRecipientName: 'Flugschule Bad Ragaz'}],
        ['online checkout (pending)', {method: 'checkout', status: 'pending'}],
      ])('accepts setting the payment method %s on an arrival', (label, paymentMethod) => {
        const kioskArrival = clientSave(arrivalValues(), KIOSK).movement;
        const pilotArrival = clientSave(arrivalValues(), PILOT).movement;

        const fromKiosk = serverDecision(clientSavePaymentMethod('arr-k', paymentMethod), KIOSK, kioskArrival);
        expect(fromKiosk.errors).toEqual([]);
        expect(fromKiosk.access).toEqual({ok: true});
        expect(fromKiosk.prepared.movement).toEqual({...kioskArrival, paymentMethod});

        const fromPilot = serverDecision(clientSavePaymentMethod('arr-p', paymentMethod), PILOT, pilotArrival);
        expect(fromPilot.errors).toEqual([]);
        expect(fromPilot.access).toEqual({ok: true});
        expect(fromPilot.prepared.movement).toEqual({...pilotArrival, paymentMethod});
      });

      it('computes the same order key as the client', () => {
        ['pilot@example.com', 'a+b@example.co', 'x'.repeat(254)].forEach(createdBy => {
          [-1, -1476021600000, -Date.parse('2026-06-16T10:00:00.000Z'), -9999999999999].forEach(negativeTimestamp => {
            expect(serverToOrderKey(createdBy, negativeTimestamp)).toBe(toOrderKey(createdBy, negativeTimestamp));
          });
        });
      });
    });
  });
});
