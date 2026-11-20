'use strict';

// Test helper: the write cases of the movement domain, as one table per
// project policy. Each case says what the domain must decide; the same table
// feeds test/rules/movementDomainParity.rules.js, which asserts that the
// built database rules decide the same (accept/reject) for the data the
// domain would write.
//
// Case: {name, type, op ('create'|'update'|'delete'), actor, existing,
//        input, settings, customsBaseUrl, expected: {errors, access}}

const { REASONS, CODES } = require('../reasons');
const { PAYMENT_METHODS } = require('../validateMovement');
const { toOrderKey } = require('../orderKey');
const { ONE_DAY_MS } = require('../checkWriteAccess');

const DATE_TIME = '2026-06-16T10:00:00.000Z';
const OTHER_LOCATION = 'LSZH';
const CUSTOMS_BASE_URL = 'https://customs.example.com/';

const ACTORS = Object.freeze({
  pilot: { uid: 'pilot-uid', email: 'pilot@example.com', isAdmin: false },
  otherPilot: { uid: 'other-uid', email: 'other@example.com', isAdmin: false },
  guest: { uid: 'guest', email: null, isAdmin: false },
  kiosk: { uid: 'kiosk', email: null, isAdmin: false },
  admin: { uid: 'admin-uid', email: 'admin@example.com', isAdmin: true },
  adminWithoutEmail: { uid: 'admin2-uid', email: null, isAdmin: true },
  // Recorded as /admins/<uid> = false: not an admin.
  staleAdmin: { uid: 'stale-admin-uid', email: 'stale@example.com', isAdmin: false },
  userWithoutEmail: { uid: 'phone-uid', email: null, isAdmin: false },
  // createdBy may hold at most 254 characters.
  longEmail: { uid: 'long-uid', email: 'a'.repeat(242) + '@example.com', isAdmin: false },
  tooLongEmail: { uid: 'too-long-uid', email: 'a'.repeat(243) + '@example.com', isAdmin: false },
});

// /admins/<uid> as the database holds it for these actors.
const ADMIN_SEED = Object.freeze({
  [ACTORS.admin.uid]: true,
  [ACTORS.adminWithoutEmail.uid]: true,
  [ACTORS.staleAdmin.uid]: false,
});

const OK = Object.freeze({ ok: true });

const accepted = () => ({ errors: [], access: OK });

const invalid = (...errors) => ({
  errors: errors.map(([field, reason]) => ({ field, reason })),
  access: OK,
});

const denied = (code, reason) => ({ errors: [], access: { ok: false, code, reason } });

const notOwner = () => denied(CODES.PERMISSION_DENIED, REASONS.NOT_OWNER);
const unauthenticated = () => denied(CODES.PERMISSION_DENIED, REASONS.UNAUTHENTICATED);
const locked = () => denied(CODES.FAILED_PRECONDITION, REASONS.MOVEMENT_LOCKED);

// The client input of a valid movement (what localToFirebase produces, minus
// the server-owned fields).
function departureInput(policy, overrides = {}) {
  return {
    aircraftType: 'C172',
    dateTime: DATE_TIME,
    departureRoute: policy.departureRoutes[0],
    duration: '01:30',
    email: 'pilot@example.com',
    firstname: 'Test',
    flightType: policy.flightTypes[0],
    immatriculation: 'HBABC',
    lastname: 'Pilot',
    location: OTHER_LOCATION,
    mtow: 1000,
    aircraftCategory: policy.aircraftCategories[0],
    // Not required by the rules; the app (and checkAppRules) asks for it.
    runway: policy.runways[0],
    ...overrides,
  };
}

function arrivalInput(policy, overrides = {}) {
  return {
    aircraftType: 'C172',
    arrivalRoute: policy.arrivalRoutes[0],
    dateTime: DATE_TIME,
    email: 'pilot@example.com',
    firstname: 'Test',
    flightType: policy.flightTypes[0],
    immatriculation: 'HBABC',
    landingCount: 1,
    lastname: 'Pilot',
    location: OTHER_LOCATION,
    mtow: 1000,
    aircraftCategory: policy.aircraftCategories[0],
    // Not required by the rules; the app (and checkAppRules) asks for it.
    runway: policy.runways[0],
    ...overrides,
  };
}

// `object` with an own "__proto__" key holding `proto`, as JSON.parse (and
// so the API's JSON body parser) gives it for `{"__proto__": ...}`.
const withOwnProto = (proto, object = {}) =>
  Object.assign(JSON.parse(`{"__proto__":${JSON.stringify(proto)}}`), object);

// Field names of Object.prototype members: unknown fields like any other.
// (Not hasOwnProperty: the client SDK calls value.hasOwnProperty() and
// cannot send it; validateMovement.spec.js covers it.)
const OBJECT_PROTOTYPE_FIELDS = ['constructor', 'toString', 'valueOf', 'isPrototypeOf'];

const inputFor = (type, policy, overrides) =>
  (type === 'departure' ? departureInput(policy, overrides) : arrivalInput(policy, overrides));

// A movement as stored: server-owned fields consistent with dateTime unless
// overridden (legacy or tampered records).
function stored(type, policy, { createdBy, ...overrides } = {}) {
  const movement = inputFor(type, policy, {});
  movement.negativeTimestamp = -Date.parse(movement.dateTime);
  if (createdBy) {
    movement.createdBy = createdBy;
    movement.createdBy_orderKey = toOrderKey(createdBy, movement.negativeTimestamp);
  }
  Object.entries(overrides).forEach(([field, value]) => {
    if (value === undefined) {
      delete movement[field];
    } else {
      movement[field] = value;
    }
  });
  return movement;
}

function makeCase(name, props) {
  return {
    name,
    op: 'create',
    actor: ACTORS.pilot,
    existing: null,
    settings: {},
    customsBaseUrl: undefined,
    ...props,
  };
}

// Per-field tables. `string`: [field, maxLength, nonEmpty].
const STRING_FIELDS = {
  common: [
    ['aircraftType', 20, true],
    ['firstname', 100, true],
    ['immatriculation', 20, true],
    ['lastname', 100, true],
    ['location', 100, true],
    ['locationName', 200, false],
    ['locationCountry', 100, false],
    ['locationTimezone', 100, false],
    ['memberNr', 50, false],
    ['phone', 30, false],
    ['remarks', 2000, false],
    ['customsFormId', 200, false],
  ],
  departure: [['route', 500, false]],
  arrival: [
    ['goAroundFeeCode', 50, true],
    ['landingFeeCode', 50, true],
  ],
};

// [field, accepted values, [rejected value, reason] pairs]
const NUMBER_FIELDS = {
  common: [
    ['mtow', [0.5, 1000], [[0, REASONS.MUST_BE_POSITIVE], [-1, REASONS.MUST_BE_POSITIVE]]],
    ['passengerCount', [0, 3], [[-1, REASONS.MUST_NOT_BE_NEGATIVE]]],
  ],
  departure: [],
  arrival: [
    ['landingCount', [1, 2], [[0, REASONS.MUST_BE_POSITIVE]]],
    ['goAroundCount', [0, 1], [[-1, REASONS.MUST_NOT_BE_NEGATIVE]]],
    ['landingFeeSingle', [0, 16.5], [[-0.5, REASONS.MUST_NOT_BE_NEGATIVE]]],
    ['landingFeeTotal', [0, 33], [[-1, REASONS.MUST_NOT_BE_NEGATIVE]]],
    ['goAroundFeeSingle', [0, 8], [[-1, REASONS.MUST_NOT_BE_NEGATIVE]]],
    ['goAroundFeeTotal', [0, 8], [[-1, REASONS.MUST_NOT_BE_NEGATIVE]]],
    ['feeTotalNet', [0, 30.65, -2], []],
    ['feeVat', [0, 2.35, -0.1], []],
    ['feeRoundingDifference', [0, -0.05, 0.05], []],
    ['feeTotalGross', [0, 33], []],
  ],
};

const REQUIRED = {
  departure: [
    'aircraftType', 'dateTime', 'departureRoute', 'duration', 'email',
    'firstname', 'flightType', 'immatriculation', 'lastname', 'location',
    'mtow', 'aircraftCategory',
  ],
  arrival: [
    'aircraftType', 'arrivalRoute', 'dateTime', 'email', 'firstname',
    'flightType', 'immatriculation', 'landingCount', 'lastname', 'location',
    'mtow', 'aircraftCategory',
  ],
};

const FLIGHT_TYPES_PROBED = ['commercial', 'paradrop', 'sar', 'not-a-flight-type'];

function validationCases(type, policy) {
  const cases = [];
  const create = (name, overrides, expected, props = {}) => cases.push(makeCase(`${type}: ${name}`, {
    type,
    input: inputFor(type, policy, overrides),
    expected,
    ...props,
  }));
  const routeField = type === 'departure' ? 'departureRoute' : 'arrivalRoute';
  const routes = type === 'departure' ? policy.departureRoutes : policy.arrivalRoutes;

  create('valid minimal movement', {}, accepted());

  REQUIRED[type].forEach(field => {
    const extra = field === 'dateTime' ? [['negativeTimestamp', REASONS.REQUIRED]] : [];
    create(`missing ${field}`, { [field]: undefined }, invalid([field, REASONS.REQUIRED], ...extra));
  });

  create('unknown field', { foo: 'bar' }, invalid(['foo', REASONS.UNKNOWN_FIELD]));
  OBJECT_PROTOTYPE_FIELDS.forEach(field =>
    create(`unknown field ${field}`, { [field]: 'x' }, invalid([field, REASONS.UNKNOWN_FIELD])));

  [...STRING_FIELDS.common, ...STRING_FIELDS[type]].forEach(([field, maxLength, nonEmpty]) => {
    create(`${field} at ${maxLength} characters`, { [field]: 'x'.repeat(maxLength) }, accepted());
    create(`${field} over ${maxLength} characters`, { [field]: 'x'.repeat(maxLength + 1) },
      invalid([field, REASONS.TOO_LONG]));
    create(`${field} as a number`, { [field]: 42 }, invalid([field, REASONS.NOT_A_STRING]));
    create(`${field} as an object`, { [field]: { value: 'x' } }, invalid([field, REASONS.NOT_A_STRING]));
    create(`${field} empty`, { [field]: '' }, nonEmpty ? invalid([field, REASONS.EMPTY]) : accepted());
  });

  // Lengths count UTF-16 code units, as in the database rules.
  create('aircraftType of 10 emoji (20 code units)', { aircraftType: '\u{1F6E9}'.repeat(10) }, accepted());
  create('aircraftType of 11 emoji (22 code units)', { aircraftType: '\u{1F6E9}'.repeat(11) },
    invalid(['aircraftType', REASONS.TOO_LONG]));
  create('lastname with 100 umlauts', { lastname: 'ä'.repeat(100) }, accepted());

  [...NUMBER_FIELDS.common, ...NUMBER_FIELDS[type]].forEach(([field, accepts, rejects]) => {
    accepts.forEach(value => create(`${field} = ${value}`, { [field]: value }, accepted()));
    rejects.forEach(([value, reason]) => create(`${field} = ${value}`, { [field]: value }, invalid([field, reason])));
    create(`${field} as a string`, { [field]: '1' }, invalid([field, REASONS.NOT_A_NUMBER]));
    create(`${field} as a boolean`, { [field]: true }, invalid([field, REASONS.NOT_A_NUMBER]));
  });

  // dateTime and the negativeTimestamp derived from it.
  [
    ['without milliseconds', '2026-06-16T10:00:00Z'],
    ['with a space', '2026-06-16 10:00:00.000Z'],
    ['with an offset', '2026-06-16T10:00:00.000+02:00'],
    ['with a trailing newline', DATE_TIME + '\n'],
    ['date only', '2026-06-16'],
  ].forEach(([label, value]) => {
    // Date.parse reads some of these; where it cannot, no timestamp is derived.
    const unparseable = Number.isNaN(Date.parse(value)) ? [['negativeTimestamp', REASONS.REQUIRED]] : [];
    create(`dateTime ${label}`, { dateTime: value }, invalid(...unparseable, ['dateTime', REASONS.INVALID_FORMAT]));
  });
  create('dateTime as a number', { dateTime: 1781604000000 },
    invalid(['negativeTimestamp', REASONS.REQUIRED], ['dateTime', REASONS.NOT_A_STRING]));
  // Matches the pattern but is no date: nothing to derive the timestamp from.
  create('dateTime in month 13', { dateTime: '2026-13-01T10:00:00.000Z' },
    invalid(['negativeTimestamp', REASONS.REQUIRED]));
  create('dateTime before 1970', { dateTime: '1969-12-31T23:59:59.000Z' },
    invalid(['negativeTimestamp', REASONS.MUST_BE_NEGATIVE]));
  create('dateTime at the epoch', { dateTime: '1970-01-01T00:00:00.000Z' },
    invalid(['negativeTimestamp', REASONS.MUST_BE_NEGATIVE]));
  create('client negativeTimestamp is ignored', { negativeTimestamp: 'garbage' }, accepted());

  create('privacyPolicyAcceptedAt', { privacyPolicyAcceptedAt: '2026-06-16T09:58:12.345Z' }, accepted());
  create('privacyPolicyAcceptedAt without milliseconds', { privacyPolicyAcceptedAt: '2026-06-16T09:58:12Z' },
    invalid(['privacyPolicyAcceptedAt', REASONS.INVALID_FORMAT]));
  create('privacyPolicyAcceptedAt as a number', { privacyPolicyAcceptedAt: 1 },
    invalid(['privacyPolicyAcceptedAt', REASONS.NOT_A_STRING]));

  // email
  [
    'a.b+c@example.co',
    'pilot_1@sub.ex-ample.info',
    'x'.repeat(242) + '@example.com',
  ].forEach(email => create(`email ${email.length > 40 ? 'of 254 characters' : email}`, { email }, accepted()));
  [
    ['without domain', 'pilot@example'],
    ['with a five-letter TLD', 'pilot@example.swiss'],
    ['with two @', 'pilot@@example.com'],
    ['with a space', 'pi lot@example.com'],
    ['with a trailing newline', 'pilot@example.com\n'],
    ['with an umlaut', 'pälot@example.com'],
  ].forEach(([label, email]) => create(`email ${label}`, { email }, invalid(['email', REASONS.INVALID_FORMAT])));
  create('email of 255 characters', { email: 'x'.repeat(243) + '@example.com' }, invalid(['email', REASONS.TOO_LONG]));
  create('email as a number', { email: 5 }, invalid(['email', REASONS.NOT_A_STRING]));

  // enums from the project
  policy.runways.forEach(runway => create(`runway ${runway}`, { runway }, accepted()));
  create('unknown runway', { runway: 'XX' }, invalid(['runway', REASONS.NOT_ALLOWED]));
  create('runway as a number', { runway: Number(policy.runways[0]) || 1 }, invalid(['runway', REASONS.NOT_ALLOWED]));

  policy.flightTypes.forEach(flightType => create(`flight type ${flightType}`, { flightType }, accepted()));
  FLIGHT_TYPES_PROBED.filter(flightType => !policy.flightTypes.includes(flightType))
    .forEach(flightType => create(`flight type ${flightType} (not enabled)`, { flightType },
      invalid(['flightType', REASONS.NOT_ALLOWED])));

  policy.aircraftCategories.forEach(aircraftCategory =>
    create(`aircraft category ${aircraftCategory}`, { aircraftCategory }, accepted()));
  create('unknown aircraft category', { aircraftCategory: 'Unbekannt' }, invalid(['aircraftCategory', REASONS.NOT_ALLOWED]));
  create('empty aircraft category', { aircraftCategory: '' }, invalid(['aircraftCategory', REASONS.NOT_ALLOWED]));

  routes.forEach(route => create(`${routeField} ${route}`, { [routeField]: route }, accepted()));
  create(`unknown ${routeField}`, { [routeField]: 'nowhere' }, invalid([routeField, REASONS.NOT_ALLOWED]));
  create(`${routeField} circuits from/to the aerodrome`, { [routeField]: 'circuits', location: policy.icao }, accepted());
  create(`${routeField} circuits, lower-case location`, { [routeField]: 'circuits', location: policy.icao.toLowerCase() },
    accepted());
  create(`${routeField} circuits from/to another aerodrome`, { [routeField]: 'circuits' },
    invalid([routeField, REASONS.CIRCUITS_NOT_LOCAL]));
  create(`${routeField} as a number`, { [routeField]: 1 }, invalid([routeField, REASONS.NOT_ALLOWED]));

  // customs form
  create('customsFormUrl without a configured base URL', { customsFormUrl: 'https://anything.example.com/x' },
    accepted());
  create('customsFormUrl under the base URL', { customsFormUrl: CUSTOMS_BASE_URL + 'forms/1' }, accepted(),
    { customsBaseUrl: CUSTOMS_BASE_URL });
  create('customsFormUrl outside the base URL', { customsFormUrl: 'https://evil.example.com/forms/1' },
    invalid(['customsFormUrl', REASONS.INVALID_PREFIX]), { customsBaseUrl: CUSTOMS_BASE_URL });
  create('customsFormUrl over 512 characters', { customsFormUrl: CUSTOMS_BASE_URL + 'x'.repeat(512) },
    invalid(['customsFormUrl', REASONS.TOO_LONG]), { customsBaseUrl: CUSTOMS_BASE_URL });
  create('customsFormUrl as a number', { customsFormUrl: 7 }, invalid(['customsFormUrl', REASONS.NOT_A_STRING]));
  create('customsFormUrl with a non-string base URL', { customsFormUrl: '42/forms' },
    invalid(['customsFormUrl', REASONS.INVALID_PREFIX]), { customsBaseUrl: 42 });

  return cases;
}

function departureOnlyCases(policy) {
  const cases = [];
  const create = (name, overrides, expected) => cases.push(makeCase(`departure: ${name}`, {
    type: 'departure',
    input: departureInput(policy, overrides),
    expected,
  }));
  create('carriageVoucher yes', { passengerCount: 2, carriageVoucher: 'yes' }, accepted());
  create('carriageVoucher no', { passengerCount: 2, carriageVoucher: 'no' }, accepted());
  create('carriageVoucher maybe with passengers', { passengerCount: 2, carriageVoucher: 'maybe' },
    invalid(['carriageVoucher', REASONS.NOT_ALLOWED]));
  create('carriageVoucher maybe without passengerCount', { carriageVoucher: 'maybe' },
    invalid(['carriageVoucher', REASONS.NOT_ALLOWED]));
  create('carriageVoucher yes without passengerCount', { carriageVoucher: 'yes' }, accepted());
  // Without passengers the rule accepts any value.
  create('carriageVoucher maybe without passengers', { passengerCount: 0, carriageVoucher: 'maybe' }, accepted());
  create('carriageVoucher as an object without passengers', { passengerCount: 0, carriageVoucher: { a: 1 } },
    accepted());
  create('carriageVoucher as a number with passengers', { passengerCount: 1, carriageVoucher: 1 },
    invalid(['carriageVoucher', REASONS.NOT_ALLOWED]));
  // The "__proto__" key must not lend the movement a passengerCount that is
  // never stored. (The SDKs' set() drop such a key; the rules then reject
  // the carriageVoucher.)
  create('carriageVoucher next to an own __proto__ key with passengerCount 0',
    withOwnProto({ passengerCount: 0 }, { carriageVoucher: 'garbage' }),
    invalid(['__proto__', REASONS.UNKNOWN_FIELD], ['carriageVoucher', REASONS.NOT_ALLOWED]));
  create('paymentMethod is not a departure field', { paymentMethod: { method: 'cash' } },
    invalid(['paymentMethod', REASONS.UNKNOWN_FIELD]));
  create('landingCount is not a departure field', { landingCount: 1 },
    invalid(['landingCount', REASONS.UNKNOWN_FIELD]));
  create('aircraftDataSource is not a departure field', { aircraftDataSource: 'registry' },
    invalid(['aircraftDataSource', REASONS.UNKNOWN_FIELD]));
  return cases;
}

function arrivalOnlyCases(policy) {
  const cases = [];
  const create = (name, overrides, expected) => cases.push(makeCase(`arrival: ${name}`, {
    type: 'arrival',
    input: arrivalInput(policy, overrides),
    expected,
  }));
  PAYMENT_METHODS.forEach(method => create(`paymentMethod ${method}`, { paymentMethod: { method } }, accepted()));
  create('paymentMethod invoice with recipient', { paymentMethod: { method: 'invoice', invoiceRecipientName: 'Acme AG' } },
    accepted());
  create('paymentMethod checkout pending (extra child)', { paymentMethod: { method: 'checkout', status: 'pending' } },
    accepted());
  create('paymentMethod unknown method', { paymentMethod: { method: 'bitcoin' } },
    invalid(['paymentMethod.method', REASONS.NOT_ALLOWED]));
  create('paymentMethod method as a number', { paymentMethod: { method: 1 } },
    invalid(['paymentMethod.method', REASONS.NOT_ALLOWED]));
  create('paymentMethod without method', { paymentMethod: { invoiceRecipientName: 'Acme AG' } },
    invalid(['paymentMethod.method', REASONS.REQUIRED]));
  create('paymentMethod as a string', { paymentMethod: 'cash' }, invalid(['paymentMethod', REASONS.NOT_AN_OBJECT]));
  // The method must be stored, not inherited through a "__proto__" key.
  create('paymentMethod with the method under an own __proto__ key',
    { paymentMethod: withOwnProto({ method: 'cash' }, { status: 'pending' }) },
    invalid(['paymentMethod', REASONS.INVALID_KEY]));
  create('paymentMethod as a list', { paymentMethod: ['cash'] }, invalid(['paymentMethod.method', REASONS.REQUIRED]));
  create('paymentMethod empty (no value)', { paymentMethod: {} }, accepted());
  create('paymentMethod recipient over 200 characters',
    { paymentMethod: { method: 'invoice', invoiceRecipientName: 'x'.repeat(201) } },
    invalid(['paymentMethod.invoiceRecipientName', REASONS.TOO_LONG]));
  create('paymentMethod recipient as a number', { paymentMethod: { method: 'invoice', invoiceRecipientName: 5 } },
    invalid(['paymentMethod.invoiceRecipientName', REASONS.NOT_A_STRING]));
  create('carriageVoucher is not an arrival field', { carriageVoucher: 'yes' },
    invalid(['carriageVoucher', REASONS.UNKNOWN_FIELD]));
  create('duration is not an arrival field', { duration: '01:00' },
    invalid(['duration', REASONS.UNKNOWN_FIELD]));
  create('route is not an arrival field', { route: 'via VOR' }, invalid(['route', REASONS.UNKNOWN_FIELD]));
  // Written by the server-side fee computation; the app sends it back.
  create('aircraftDataSource registry', { aircraftDataSource: 'registry' }, accepted());
  create('aircraftDataSource manual', { aircraftDataSource: 'manual' }, accepted());
  create('aircraftDataSource unknown value', { aircraftDataSource: 'guessed' },
    invalid(['aircraftDataSource', REASONS.NOT_ALLOWED]));
  create('aircraftDataSource as a number', { aircraftDataSource: 1 },
    invalid(['aircraftDataSource', REASONS.NOT_ALLOWED]));
  return cases;
}

function durationCases(policy) {
  const cases = [];
  const create = (name, duration, expected) => cases.push(makeCase(`departure: duration ${name}`, {
    type: 'departure',
    input: departureInput(policy, { duration }),
    expected,
  }));
  create('01:30', '01:30', accepted());
  create('99:99 (pattern only)', '99:99', accepted());
  create('1:30', '1:30', invalid(['duration', REASONS.INVALID_FORMAT]));
  create('01:30:00', '01:30:00', invalid(['duration', REASONS.INVALID_FORMAT]));
  create('with Arabic-Indic digits', '٠١:30', invalid(['duration', REASONS.INVALID_FORMAT]));
  create('with a trailing newline', '01:30\n', invalid(['duration', REASONS.INVALID_FORMAT]));
  create('as a number', 90, invalid(['duration', REASONS.NOT_A_STRING]));
  return cases;
}

// RTDB update() semantics: only written fields are validated, the required
// children always.
function updateCases(type, policy) {
  const cases = [];
  const owner = ACTORS.pilot.email;
  const update = (name, existingOverrides, input, expected, props = {}) => cases.push(makeCase(`${type}: update ${name}`, {
    type,
    op: 'update',
    existing: stored(type, policy, { createdBy: owner, ...existingOverrides }),
    input,
    expected,
    ...props,
  }));
  update('of one field', {}, { remarks: 'changed' }, accepted());
  update('with the whole movement (as the client sends it)', {}, inputFor(type, policy, { remarks: 'x' }), accepted());
  update('moving dateTime', {}, { dateTime: '2026-06-17T08:15:00.000Z' }, accepted());
  update('ignoring client server-owned fields', {},
    { remarks: 'x', negativeTimestamp: -1, createdBy: 'pilot@example.com', createdBy_orderKey: 'forged' }, accepted());
  update('with an invalid field', {}, { mtow: 0 }, invalid(['mtow', REASONS.MUST_BE_POSITIVE]));
  update('with an unknown field', {}, { foo: 1 }, invalid(['foo', REASONS.UNKNOWN_FIELD]));
  if (type === 'arrival') {
    // An arrival priced by the server, edited in the app: the whole movement
    // comes back, with the server's fee fields and data source.
    const priced = { aircraftDataSource: 'registry', landingFeeSingle: 27.75, landingFeeTotal: 27.75,
      feeTotalNet: 27.75, feeVat: 2.25, feeRoundingDifference: 0, feeTotalGross: 30 };
    update('of an arrival priced by the server, as the app sends it', priced,
      { ...inputFor(type, policy, { remarks: 'x' }), ...priced }, accepted());
  }
  update('with an own __proto__ key', {}, withOwnProto({ remarks: 'x' }, type === 'departure'
    ? { carriageVoucher: 'garbage' }
    : { paymentMethod: { status: 'pending' } }),
  invalid(['__proto__', REASONS.UNKNOWN_FIELD], type === 'departure'
    ? ['carriageVoucher', REASONS.NOT_ALLOWED]
    : ['paymentMethod.method', REASONS.REQUIRED]));
  update('removing an optional field', { remarks: 'old' }, { remarks: null }, accepted());
  update('removing a required field', {}, { mtow: null }, invalid(['mtow', REASONS.REQUIRED]));
  update('removing dateTime', {}, { dateTime: null },
    invalid(['dateTime', REASONS.REQUIRED], ['negativeTimestamp', REASONS.REQUIRED]));
  update('next to a stored invalid field', { aircraftType: 'X'.repeat(30) }, { remarks: 'x' }, accepted());
  update('rewriting a stored invalid field', { aircraftType: 'X'.repeat(30) }, { aircraftType: 'X'.repeat(30) },
    invalid(['aircraftType', REASONS.TOO_LONG]));
  update('next to a stored unknown field', { legacyField: 'x' }, { remarks: 'x' }, accepted());
  update('of a stored movement missing a required field', { mtow: undefined }, { remarks: 'x' },
    invalid(['mtow', REASONS.REQUIRED]));
  update('of a stored movement with a tampered negativeTimestamp', { negativeTimestamp: -1 }, { remarks: 'x' },
    accepted());
  update('of a stored circuits movement to another location',
    { [type === 'departure' ? 'departureRoute' : 'arrivalRoute']: 'circuits', location: policy.icao },
    { location: OTHER_LOCATION }, accepted());
  update('with customsFormUrl outside the base URL', {}, { customsFormUrl: 'https://evil.example.com/' },
    invalid(['customsFormUrl', REASONS.INVALID_PREFIX]), { customsBaseUrl: CUSTOMS_BASE_URL });
  update('next to a customsFormUrl outside the base URL', { customsFormUrl: 'https://old.example.com/' },
    { remarks: 'x' }, accepted(), { customsBaseUrl: CUSTOMS_BASE_URL });

  if (type === 'departure') {
    update('of passengerCount next to a stored carriageVoucher', { passengerCount: 0, carriageVoucher: 'maybe' },
      { passengerCount: 2 }, accepted());
    update('of passengerCount and the stored carriageVoucher', { passengerCount: 0, carriageVoucher: 'maybe' },
      { passengerCount: 2, carriageVoucher: 'maybe' }, invalid(['carriageVoucher', REASONS.NOT_ALLOWED]));
  } else {
    update('setting the payment method', {}, { paymentMethod: { method: 'invoice', invoiceRecipientName: 'Acme' } },
      accepted());
    update('setting a pending payment method', {}, { paymentMethod: { method: 'checkout', status: 'pending' } },
      accepted());
    update('replacing the payment method', { paymentMethod: { method: 'checkout', status: 'pending' } },
      { paymentMethod: { method: 'cash' } }, accepted());
    update('removing the payment method with {}', { paymentMethod: { method: 'cash' } }, { paymentMethod: {} },
      accepted());
    update('setting an invalid payment method', {}, { paymentMethod: { method: 'gold' } },
      invalid(['paymentMethod.method', REASONS.NOT_ALLOWED]));
    update('setting the payment method of a legacy movement', { aircraftType: '', landingFeeCode: '' },
      { paymentMethod: { method: 'cash' } }, accepted());
  }
  return cases;
}

// Ownership: the expected decision on personal-access projects; shared
// access accepts every authenticated actor.
function accessCases(type, policy) {
  const cases = [];
  const personal = expected => (policy.personalAccess ? expected : accepted());
  const add = (name, props, expected) => cases.push(makeCase(`${type}: ${name}`, { type, ...props, expected }));
  const input = inputFor(type, policy, {});
  const owned = by => stored(type, policy, { createdBy: by });
  const ownerless = () => stored(type, policy, {});

  add('anonymous create', { actor: null, input }, unauthenticated());
  add('pilot creates (owner from token)', { actor: ACTORS.pilot, input }, accepted());
  add('pilot cannot pick another owner (ignored)', { actor: ACTORS.pilot, input: { ...input, createdBy: 'x@example.com' } },
    accepted());
  add('guest creates ownerless', { actor: ACTORS.guest, input }, accepted());
  add('guest cannot set an owner (ignored)', { actor: ACTORS.guest, input: { ...input, createdBy: 'x@example.com' } },
    accepted());
  add('kiosk creates ownerless', { actor: ACTORS.kiosk, input }, accepted());
  add('admin creates', { actor: ACTORS.admin, input }, accepted());
  add('admin without e-mail creates ownerless', { actor: ACTORS.adminWithoutEmail, input }, accepted());
  add('disabled admin creates as a pilot', { actor: ACTORS.staleAdmin, input }, accepted());
  add('user without e-mail creates', { actor: ACTORS.userWithoutEmail, input }, personal(notOwner()));
  add('owner with a 254-character e-mail creates', { actor: ACTORS.longEmail, input }, accepted());
  add('owner with a 255-character e-mail creates', { actor: ACTORS.tooLongEmail, input },
    invalid(['createdBy', REASONS.TOO_LONG]));

  const edit = { remarks: 'edited' };
  add('anonymous update', { op: 'update', actor: null, existing: ownerless(), input: edit }, unauthenticated());
  add('pilot updates own', { op: 'update', actor: ACTORS.pilot, existing: owned(ACTORS.pilot.email), input: edit },
    accepted());
  add('pilot updates another pilot movement',
    { op: 'update', actor: ACTORS.otherPilot, existing: owned(ACTORS.pilot.email), input: edit }, personal(notOwner()));
  add('pilot updates an ownerless movement', { op: 'update', actor: ACTORS.pilot, existing: ownerless(), input: edit },
    personal(notOwner()));
  add('guest updates an ownerless movement', { op: 'update', actor: ACTORS.guest, existing: ownerless(), input: edit },
    accepted());
  add('kiosk updates an ownerless movement', { op: 'update', actor: ACTORS.kiosk, existing: ownerless(), input: edit },
    accepted());
  add('guest updates an owned movement',
    { op: 'update', actor: ACTORS.guest, existing: owned(ACTORS.pilot.email), input: edit }, personal(notOwner()));
  add('admin updates another pilot movement',
    { op: 'update', actor: ACTORS.admin, existing: owned(ACTORS.pilot.email), input: edit }, accepted());
  add('admin without e-mail updates an owned movement',
    { op: 'update', actor: ACTORS.adminWithoutEmail, existing: owned(ACTORS.pilot.email), input: edit }, accepted());
  add('disabled admin updates another pilot movement',
    { op: 'update', actor: ACTORS.staleAdmin, existing: owned(ACTORS.pilot.email), input: edit }, personal(notOwner()));
  add('user without e-mail updates an ownerless movement',
    { op: 'update', actor: ACTORS.userWithoutEmail, existing: ownerless(), input: edit }, personal(notOwner()));
  add('owner keeps ownership when sending another createdBy',
    { op: 'update', actor: ACTORS.pilot, existing: owned(ACTORS.pilot.email), input: { createdBy: 'x@example.com' } },
    accepted());
  add('guest cannot claim an ownerless movement',
    { op: 'update', actor: ACTORS.guest, existing: ownerless(), input: { createdBy: 'x@example.com' } }, accepted());

  add('anonymous delete', { op: 'delete', actor: null, existing: ownerless() }, unauthenticated());
  add('pilot deletes own', { op: 'delete', actor: ACTORS.pilot, existing: owned(ACTORS.pilot.email) }, accepted());
  add('pilot deletes another pilot movement',
    { op: 'delete', actor: ACTORS.otherPilot, existing: owned(ACTORS.pilot.email) }, personal(notOwner()));
  add('pilot deletes an ownerless movement', { op: 'delete', actor: ACTORS.pilot, existing: ownerless() },
    personal(notOwner()));
  add('guest deletes an ownerless movement', { op: 'delete', actor: ACTORS.guest, existing: ownerless() },
    personal(notOwner()));
  add('kiosk deletes an ownerless movement', { op: 'delete', actor: ACTORS.kiosk, existing: ownerless() },
    personal(notOwner()));
  add('admin deletes another pilot movement',
    { op: 'delete', actor: ACTORS.admin, existing: owned(ACTORS.pilot.email) }, accepted());
  add('disabled admin deletes another pilot movement',
    { op: 'delete', actor: ACTORS.staleAdmin, existing: owned(ACTORS.pilot.email) }, personal(notOwner()));
  return cases;
}

// The lock: settings/lockDate (+ one day grace), or with lockOnDateTime the
// derived settings/lockDateIso with the numeric test as fallback.
const LOCK_DATE = Date.parse('2026-05-31T22:00:00.000Z');
const LOCK_DATE_ISO = new Date(LOCK_DATE + ONE_DAY_MS).toISOString();
const AT_THRESHOLD = LOCK_DATE_ISO;
const AFTER_THRESHOLD = new Date(LOCK_DATE + ONE_DAY_MS + 1).toISOString();
const BEFORE_LOCK = '2026-05-20T10:00:00.000Z';

function lockCases(type, policy) {
  const cases = [];
  const owner = ACTORS.pilot.email;
  const settings = { lockDate: LOCK_DATE, lockDateIso: LOCK_DATE_ISO };
  const add = (name, props, expected) => cases.push(makeCase(`${type}: lock ${name}`, {
    type,
    settings,
    ...props,
    expected,
  }));
  const at = dateTime => inputFor(type, policy, { dateTime });
  const storedAt = (dateTime, extra = {}) => stored(type, policy, { createdBy: owner, dateTime, ...extra });
  const fixNegativeTimestamp = movement => ({ ...movement, negativeTimestamp: -Date.parse(movement.dateTime) });
  const consistent = (dateTime, extra) => {
    const movement = fixNegativeTimestamp(storedAt(dateTime, extra));
    movement.createdBy_orderKey = toOrderKey(owner, movement.negativeTimestamp);
    return movement;
  };

  add('create without a lock date', { settings: {}, input: at(BEFORE_LOCK) }, accepted());
  add('create after the lock', { input: at(DATE_TIME) }, accepted());
  add('create 1 ms after the grace day', { input: at(AFTER_THRESHOLD) }, accepted());
  add('create at the end of the grace day', { input: at(AT_THRESHOLD) }, locked());
  add('create before the lock date', { input: at(BEFORE_LOCK) }, locked());
  add('admin create before the lock date', { actor: ACTORS.admin, input: at(BEFORE_LOCK) }, locked());
  add('create backdated with a recent client negativeTimestamp',
    { input: { ...at(BEFORE_LOCK), negativeTimestamp: -Date.parse(DATE_TIME) } }, locked());
  add('update after the lock', { op: 'update', existing: consistent(DATE_TIME), input: { remarks: 'x' } }, accepted());
  add('update of a locked movement', { op: 'update', existing: consistent(BEFORE_LOCK), input: { remarks: 'x' } },
    locked());
  add('update moving a locked movement out', { op: 'update', existing: consistent(BEFORE_LOCK), input: { dateTime: DATE_TIME } },
    locked());
  add('update moving a movement into the lock', { op: 'update', existing: consistent(DATE_TIME), input: { dateTime: BEFORE_LOCK } },
    locked());
  add('admin update of a locked movement',
    { op: 'update', actor: ACTORS.admin, existing: consistent(BEFORE_LOCK), input: { remarks: 'x' } }, locked());
  // A record written with a recent negativeTimestamp and a backdated
  // dateTime (the bypass the numeric rule allows): the derived timestamp of
  // the next state is in the lock.
  add('update of a tampered backdated movement',
    { op: 'update', existing: storedAt(BEFORE_LOCK, { negativeTimestamp: -Date.parse(DATE_TIME) }), input: { remarks: 'x' } },
    locked());
  add('delete after the lock', { op: 'delete', existing: consistent(DATE_TIME) }, accepted());
  add('delete of a locked movement', { op: 'delete', existing: consistent(BEFORE_LOCK) }, locked());
  add('delete of a movement at the end of the grace day', { op: 'delete', existing: consistent(AT_THRESHOLD) }, locked());
  add('pilot delete of another pilot locked movement (ownership first)',
    { op: 'delete', actor: ACTORS.otherPilot, existing: consistent(BEFORE_LOCK) },
    policy.personalAccess ? notOwner() : locked());

  // Which threshold applies.
  const laterIso = '2026-06-10T00:00:00.000Z';
  add('create between the numeric threshold and a later lockDateIso',
    { settings: { lockDate: LOCK_DATE, lockDateIso: laterIso }, input: at('2026-06-05T10:00:00.000Z') },
    policy.lockOnDateTime ? locked() : accepted());
  add('create while lockDateIso is absent (numeric fallback)',
    { settings: { lockDate: LOCK_DATE }, input: at(BEFORE_LOCK) }, locked());
  add('create after the lock while lockDateIso is absent',
    { settings: { lockDate: LOCK_DATE }, input: at(DATE_TIME) }, accepted());
  add('lockDateIso without lockDate does not lock',
    { settings: { lockDateIso: LOCK_DATE_ISO }, input: at(BEFORE_LOCK) }, accepted());
  add('create with a non-numeric lockDate',
    { settings: { lockDate: '2026-05-31', lockDateIso: LOCK_DATE_ISO }, input: at(DATE_TIME) },
    policy.lockOnDateTime ? accepted() : locked());
  add('create with a non-numeric lockDate and no lockDateIso',
    { settings: { lockDate: '2026-05-31' }, input: at(DATE_TIME) }, locked());
  add('create with a non-string lockDateIso',
    { settings: { lockDate: LOCK_DATE, lockDateIso: 12345 }, input: at(DATE_TIME) },
    policy.lockOnDateTime ? locked() : accepted());
  return cases;
}

/**
 * All cases for a policy (see projectPolicies.js). Names are unique.
 */
function buildCases(policy) {
  return [
    ...validationCases('departure', policy),
    ...validationCases('arrival', policy),
    ...departureOnlyCases(policy),
    ...arrivalOnlyCases(policy),
    ...durationCases(policy),
    ...updateCases('departure', policy),
    ...updateCases('arrival', policy),
    ...accessCases('departure', policy),
    ...accessCases('arrival', policy),
    ...lockCases('departure', policy),
    ...lockCases('arrival', policy),
  ];
}

module.exports = {
  ACTORS,
  ADMIN_SEED,
  CUSTOMS_BASE_URL,
  DATE_TIME,
  buildCases,
  departureInput,
  arrivalInput,
  stored,
  withOwnProto,
};
