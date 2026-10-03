// Parity: the server-side airstat engine (functions/reports/airstat) must
// produce the same CSV as this client report for the same data, month and
// options. Both read the same in-memory database, so they see the same
// query order; the client's creation time is pinned to the engine's `now`.
// MovementReport reads __CONF__ at module load time, so it is loaded with
// jest.resetModules() + require() after the global is set.
// The client breaks same-minute ties in the default locale, the engine in
// de-CH. They agree in en, de, fr and it; elsewhere the spec is skipped.

const moment = require('moment-timezone');
const {generateAirstatReport, AirstatDataError} = require('../../functions/reports/airstat');
const {createFakeRtdb} = require('../../functions/reports/airstat/testing/fakeRtdb');
const {mulberry32} = require('../../functions/reports/airstat/testing/mulberry32');
const {REGISTRATION_LOCALE} = require('../../functions/reports/airstat/movements');
const {buildServerConfigFor} = require('../../tasks/generateServerConfig');

const NOW = Date.UTC(2026, 9, 3, 8, 12, 34);
const MOVEMENTS_PER_CASE = 150;
const SHARED_MINUTES = 30;

const FLIGHT_TYPES = [
  'private', 'commercial', 'instruction', 'aerotow', 'paradrop',
  'glider_private_aerotow', 'glider_private_winch', 'glider_private_self',
  'glider_instruction_aerotow', 'glider_instruction_winch',
  'glider_instruction_self', 'military', 'sar',
];
const CATEGORIES = [
  'Flugzeug', 'Eigenbauflugzeug', 'Motorsegler', 'Hubschrauber',
  'Eigenbauhubschrauber', 'Segelflugzeug', 'Eigenbausegelflugzeug',
  'Ballon (Heissluft)', 'Ultraleichtflugzeug (3-Achsen gesteuert)', 'Trike',
  undefined, '', 'Unbekannt',
];
// Few registrations, so movements at the same minute often tie on it too.
const REGISTRATIONS = ['HBKOF', 'HBKOF', 'HBXAB', 'HBZCD', 'DEABC', 'hbkof', 'HB-KOF', '', undefined];
const TIE_PROBES = ['HBAAA', 'HBZZZ', 'HBCHA', 'HBCZZ', 'HBMMM', ...REGISTRATIONS.filter(Boolean)];

const sameTieOrder = TIE_PROBES.every(a => TIE_PROBES.every(b =>
  Math.sign(a.localeCompare(b)) === Math.sign(new Intl.Collator(REGISTRATION_LOCALE).compare(a, b))));
const LOCATIONS = ['LSZE', 'LSZH', 'lszb', 'LSZB', 'LSZR', 'XXXX', 'St. Gallen', '', undefined];
const RUNWAYS = ['12', '30', '30', '99', '', undefined];
const DEPARTURE_ROUTES = ['N', 'O', 'W', 'circuits', undefined];
const ARRIVAL_ROUTES = ['N', 'O', 'W', 'circuits', undefined];
const LANDING_COUNTS = [undefined, 0, 1, 1, 1, 2, 3, 5];
const GO_AROUND_COUNTS = [undefined, 0, 0, 0, 1, 2];
const TEXTS = ['Müller', '=cmd()', '+41 79', '-5', 'a,b', 'a;b', 'say "hi"', 'line\nbreak', '#tag', '', undefined];
const FEES = [undefined, 0, 20, 12.5, 0.1, 0.2];
const PAYMENT_METHODS = [
  undefined, {method: 'cash'}, {method: 'card'},
  {method: 'invoice', invoiceRecipientName: 'MG Ragaz'}, {method: 'invoice'},
];
const KEY_CHARS = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';

const AERODROMES = {
  LSZE: {name: 'Bad Ragaz'},
  LSZH: {name: 'Zürich'},
  LSZB: {name: 'Bern'},
  LSZR: 0,
};
const AIRCRAFTS = {
  club: {HBKOF: true, HBZCD: 'yes'},
  homeBase: {HBXAB: true, DEABC: 1},
};

const pick = (random, list) => list[Math.floor(random() * list.length)];

// Defined fields only, as the database stores them.
const compact = object => JSON.parse(JSON.stringify(object));

function randomStore(seed, year, month) {
  const random = mulberry32(seed);
  const start = Date.UTC(year, month - 1, 1) - 3 * 3600 * 1000;
  const span = Date.UTC(year, month, 1) - Date.UTC(year, month - 1, 1) + 6 * 3600 * 1000;
  const randomMinute = () => start + Math.floor(random() * span / 60000) * 60000;
  // Half the movements share a few minutes, so every store has many-way ties
  // of departures, arrivals and circuits; the rest spread over the range.
  const sharedMinutes = Array.from({length: SHARED_MINUTES}, randomMinute);
  const store = {departures: {}, arrivals: {}, settings: {aircrafts: AIRCRAFTS}, aerodromes: AERODROMES};

  for (let i = 0; i < MOVEMENTS_PER_CASE; i++) {
    let key = '-N';
    for (let c = 0; c < 18; c++) {
      key += pick(random, KEY_CHARS);
    }
    const minute = random() < 0.5 ? pick(random, sharedMinutes) : randomMinute();
    const instant = minute + Math.floor(random() * 60000);
    const anonymized = random() < 0.1;
    const movement = {
      dateTime: new Date(instant).toISOString(),
      negativeTimestamp: -instant,
      immatriculation: anonymized ? undefined : pick(random, REGISTRATIONS),
      aircraftCategory: pick(random, CATEGORIES),
      flightType: pick(random, FLIGHT_TYPES),
      mtow: pick(random, [undefined, 450, 750, 1200, 5700]),
      passengerCount: pick(random, [undefined, 0, 1, 3]),
      runway: pick(random, RUNWAYS),
      location: pick(random, LOCATIONS),
      lastname: anonymized ? undefined : pick(random, TEXTS),
      email: anonymized ? undefined : pick(random, ['pilot@example.ch', '@x', undefined]),
      remarks: anonymized ? undefined : pick(random, TEXTS),
      memberNr: anonymized ? undefined : pick(random, ['1234', undefined]),
      anonymized: anonymized || undefined,
    };
    if (random() < 0.5) {
      store.departures[key] = compact({...movement, departureRoute: pick(random, DEPARTURE_ROUTES)});
    } else {
      store.arrivals[key] = compact({
        ...movement,
        arrivalRoute: pick(random, ARRIVAL_ROUTES),
        landingCount: pick(random, LANDING_COUNTS),
        goAroundCount: pick(random, GO_AROUND_COUNTS),
        landingFeeTotal: pick(random, FEES),
        goAroundFeeTotal: pick(random, FEES),
        paymentMethod: pick(random, PAYMENT_METHODS),
      });
    }
  }
  return store;
}

const movement = (dateTime, fields) => ({
  dateTime,
  negativeTimestamp: -Date.parse(dateTime),
  immatriculation: 'HBKOF',
  aircraftCategory: 'Flugzeug',
  flightType: 'private',
  location: 'LSZH',
  ...fields,
});

const edgeStore = (departures, arrivals, aerodromes = AERODROMES) =>
  ({departures, arrivals, settings: {aircrafts: AIRCRAFTS}, aerodromes});

// Literal stores for orderings and boundaries random data rarely hits.
const EDGE_STORES = {
  'a three-way tie of a departure circuit, a departure and a split arrival': [2026, 10, edgeStore(
    {
      '-Na1': movement('2026-10-02T08:00:05.000Z', {departureRoute: 'circuits'}),
      '-Na2': movement('2026-10-02T08:00:40.000Z', {departureRoute: 'N'}),
    },
    {'-Nb1': movement('2026-10-02T08:00:20.000Z', {arrivalRoute: 'N', landingCount: 3})},
  )],
  'the repeated hour when DST ends': [2026, 10, edgeStore(
    {
      '-Nc1': movement('2026-10-25T00:30:00.000Z', {immatriculation: 'HBZZZ'}),
      '-Nc2': movement('2026-10-25T01:30:00.000Z', {immatriculation: 'HBAAA'}),
      '-Nc3': movement('2026-10-25T01:29:59.999Z', {immatriculation: 'HBMMM'}),
    },
    {},
  )],
  'movements at and just outside the month bounds': [2026, 3, edgeStore(
    {
      '-Nd1': movement('2026-02-28T22:59:59.999Z'),
      '-Nd2': movement('2026-02-28T23:00:00.000Z'),
      '-Nd3': movement('2026-03-31T21:59:59.999Z'),
      '-Nd4': movement('2026-03-31T22:00:00.000Z'),
    },
    {},
  )],
  'a key used by a departure and an arrival': [2026, 10, edgeStore(
    {'-Ne1': movement('2026-10-05T10:00:00.000Z')},
    {'-Ne1': movement('2026-10-04T10:00:00.000Z', {arrivalRoute: 'N', landingCount: 2})},
  )],
  'circuit variants': [2026, 10, edgeStore(
    {},
    {
      '-Nf1': movement('2026-10-06T10:00:00.000Z', {arrivalRoute: 'N', landingCount: 3}),
      '-Nf2': movement('2026-10-06T10:05:00.000Z', {arrivalRoute: 'O', landingCount: 1, goAroundCount: 1}),
      '-Nf3': movement('2026-10-06T10:10:00.000Z', {arrivalRoute: 'W', goAroundCount: 2}),
      '-Nf4': movement('2026-10-06T10:15:00.000Z', {arrivalRoute: 'N', landingCount: 2}),
      '-Nf5': movement('2026-10-06T10:20:00.000Z', {arrivalRoute: 'circuits', landingCount: 4, goAroundCount: 1}),
      '-Nf6': movement('2026-10-06T10:25:00.000Z', {arrivalRoute: 'N', landingCount: 0, goAroundCount: 3,
        landingFeeTotal: 15, goAroundFeeTotal: 7.5}),
    },
  )],
  'the tenant aerodrome missing from /aerodromes': [2026, 10, edgeStore(
    {},
    {'-Ng1': movement('2026-10-07T10:00:00.000Z', {arrivalRoute: 'N', landingCount: 2, location: 'LSZE'})},
    {LSZH: {name: 'Zürich'}},
  )],
  'an empty month': [2026, 10, edgeStore({}, {})],
};

describe('util', () => {
  if (!sameTieOrder) {
    console.warn(`Skipping the airstat parity spec: the default locale breaks ties unlike ${REGISTRATION_LOCALE}`);
  }

  (sameTieOrder ? describe : describe.skip)('MovementReport parity with the server engine', () => {
    let currentDb;

    function loadClient(clientConf) {
      global.__CONF__ = clientConf;
      jest.resetModules();
      jest.doMock('./firebase', () => ({__esModule: true, default: path => currentDb.ref(path)}));
      jest.doMock('firebase/database', () => ({
        get: target => target.once('value'),
        query: (ref, ...constraints) => constraints.reduce((query, constraint) => constraint(query), ref),
        orderByChild: child => query => query.orderByChild(child),
        startAt: value => query => query.startAt(value),
        endAt: value => query => query.endAt(value),
      }));
      return {
        MovementReport: require('./MovementReport').default,
        aircrafts: require('./aircrafts'),
        aerodromes: require('./aerodromes'),
      };
    }

    afterAll(() => {
      delete global.__CONF__;
    });

    describe.each([[false, 20261003], [true, 20261103]])('memberManagement %s', (memberManagement, seedBase) => {
      const serverConfig = {...buildServerConfigFor('lsze', 'production'), memberManagement};
      let client;

      beforeAll(() => {
        client = loadClient({
          aerodrome: {ICAO: serverConfig.aerodrome.ICAO, runways: {...serverConfig.aerodrome.runways}},
          enabledFlightTypes: {},
          memberManagement,
        });
      });

      async function compare(store, year, month, internal, delimiter) {
        currentDb = createFakeRtdb(store);
        const report = new client.MovementReport(year, month, {internal, delimiter, download: false});
        report.creationDate = moment.tz(NOW, 'Europe/Zurich');
        const expected = await new Promise(resolve => report.generate(resolve));
        const clientQuery = currentDb.calls.find(call => call.path === '/departures');

        const engineDb = createFakeRtdb(store);
        const request = {year, month, internal};
        if (delimiter !== undefined) {
          request.delimiter = delimiter;
        }
        const actual = await generateAirstatReport(engineDb, serverConfig, request, {now: NOW});

        expect(actual.csv).toBe(expected);
        expect(actual.fileName).toBe(report.getFileName());
        expect(actual.range).toEqual({startAt: clientQuery.startAt, endAt: clientQuery.endAt});
        return actual;
      }

      const cases = [];
      [[2025, 12], [2026, 3], [2026, 10]].forEach(([year, month]) => {
        [false, true].forEach(internal => {
          [',', ';'].forEach(delimiter => {
            cases.push([year, month, internal, delimiter]);
          });
        });
      });
      cases.push([2026, 10, false, undefined], [2026, 10, true, undefined]);

      it.each(cases.map((testCase, index) => [...testCase, seedBase + index]))(
        '%i-%i internal %s delimiter %j matches on random data (seed %i)',
        async (year, month, internal, delimiter, seed) => {
          const result = await compare(randomStore(seed, year, month), year, month, internal, delimiter);
          expect(result.rowCount).toBeGreaterThan(100);
        }
      );

      it.each(Object.keys(EDGE_STORES))('matches for %s', async name => {
        const [year, month, store] = EDGE_STORES[name];
        await compare(store, year, month, true, ',');
        await compare(store, year, month, false, ';');
      });

      it('orders the three-way tie like the client', async () => {
        const [year, month, store] = EDGE_STORES['a three-way tie of a departure circuit, a departure and a split arrival'];
        const {csv} = await compare(store, year, month, true, ',');
        const keys = csv.trim().split('\n').slice(1).map(line => line.split(',')[15]);
        expect(keys).toEqual(['NB1_CIRCUITS', 'NB1', 'NA2']);
      });

      it('fails where the client fails: an unknown flight type', async () => {
        const store = edgeStore({}, {
          '-Nh1': movement('2026-10-08T10:00:00.000Z', {flightType: 'bogus', arrivalRoute: 'N', landingCount: 2}),
        });
        currentDb = createFakeRtdb(store);
        const report = new client.MovementReport(2026, 10, {internal: true, download: false});
        const snapshots = await Promise.all([{key: 'D', path: '/departures'}, {key: 'A', path: '/arrivals'}]
          .map(type => report.readMovements(type)));
        const aircrafts = await client.aircrafts.fetch();
        const aerodromes = await client.aerodromes.fetch();
        expect(() => report.buildContent(snapshots, aircrafts, aerodromes)).toThrow('Flight type "bogus" not found');

        const error = await generateAirstatReport(createFakeRtdb(store), serverConfig, {year: 2026, month: 10}, {now: NOW})
          .then(() => null, e => e);
        expect(error).toBeInstanceOf(AirstatDataError);
        expect(error.problems).toEqual([
          {code: 'unknown_flight_type', list: 'arrivals', key: '-Nh1', reference: 'NH1', value: 'bogus'},
        ]);
      });
    });
  });
});
