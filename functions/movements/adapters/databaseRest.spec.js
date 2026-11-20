/** @jest-environment node */
'use strict';

jest.mock('firebase-admin/app', () => ({ getApp: jest.fn() }));

const {
  createDatabaseRestClient,
  resolveTarget,
  RulesRejectedError,
  DatabaseRestError,
} = require('./databaseRest');

const PILOT = { uid: 'pilot-uid', token: { email: 'pilot+1@example.com' } };

function response(status, body) {
  const text = body === undefined ? '' : typeof body === 'string' ? body : JSON.stringify(body);
  return { ok: status >= 200 && status < 300, status, text: async () => text };
}

function fakeApp(databaseURL = 'https://lsze-test.firebaseio.com') {
  const credential = {
    getAccessToken: jest.fn(async () => ({ access_token: `access-${credential.getAccessToken.mock.calls.length}`, expires_in: 3600 })),
  };
  return { options: { databaseURL, credential } };
}

function setup({ app = fakeApp(), env = {}, answer = response(200, { name: '-Nnew' }), now } = {}) {
  const fetchImpl = jest.fn(async () => (typeof answer === 'function' ? answer() : answer));
  const client = createDatabaseRestClient({ app: () => app, env, fetchImpl, now });
  const call = index => {
    const [url, init] = fetchImpl.mock.calls[index];
    return { url: new URL(url), init };
  };
  return { app, client, fetchImpl, call };
}

describe('functions', () => {
  describe('movements/adapters/databaseRest', () => {
    describe('resolveTarget', () => {
      it.each([
        ['https://lsze-test.firebaseio.com', { origin: 'https://lsze-test.firebaseio.com', namespace: null, emulator: false }],
        ['https://lsze-test.firebaseio.com/', { origin: 'https://lsze-test.firebaseio.com', namespace: null, emulator: false }],
        [
          'https://lsze-default-rtdb.europe-west1.firebasedatabase.app',
          { origin: 'https://lsze-default-rtdb.europe-west1.firebasedatabase.app', namespace: null, emulator: false },
        ],
        ['http://127.0.0.1:9000?ns=demo-x', { origin: 'http://127.0.0.1:9000', namespace: 'demo-x', emulator: false }],
      ])('uses %s as it is', (databaseURL, target) => {
        expect(resolveTarget(databaseURL, {})).toEqual(target);
      });

      it.each([
        ['https://LSZE-test.firebaseio.com', 'lsze-test'],
        ['https://lsze-default-rtdb.europe-west1.firebasedatabase.app', 'lsze-default-rtdb'],
        ['https://lsze-test.firebaseio.com?ns=other', 'other'],
      ])('sends requests for %s to the emulator with namespace %s', (databaseURL, namespace) => {
        expect(resolveTarget(databaseURL, { FIREBASE_DATABASE_EMULATOR_HOST: '127.0.0.1:9000' })).toEqual({
          origin: 'http://127.0.0.1:9000', namespace, emulator: true,
        });
      });

      it.each([undefined, ''])('fails without a databaseURL (%j)', databaseURL => {
        expect(() => resolveTarget(databaseURL, {})).toThrow(DatabaseRestError);
      });
    });

    describe('write', () => {
      it('pushes as the caller with the service account token', async () => {
        const { client, call, app } = setup();

        const answer = await client.write('POST', 'departures', { a: 1 }, PILOT);

        expect(answer).toEqual({ name: '-Nnew' });
        const { url, init } = call(0);
        expect(url.origin + url.pathname).toBe('https://lsze-test.firebaseio.com/departures.json');
        expect(JSON.parse(url.searchParams.get('auth_variable_override'))).toEqual(PILOT);
        expect(url.searchParams.has('ns')).toBe(false);
        expect(url.searchParams.has('print')).toBe(false);
        expect(init.method).toBe('POST');
        expect(init.headers).toEqual({ Authorization: 'Bearer access-1', 'Content-Type': 'application/json' });
        expect(JSON.parse(init.body)).toEqual({ a: 1 });
        expect(init.signal).toBeInstanceOf(AbortSignal);
        expect(app.options.credential.getAccessToken).toHaveBeenCalledTimes(1);
      });

      it('sends an update without echo (print=silent)', async () => {
        const { client, call } = setup({ answer: response(204) });

        expect(await client.write('PATCH', 'arrivals/-Nkey', { paymentMethod: null }, PILOT)).toBeNull();
        const { url, init } = call(0);
        expect(url.pathname).toBe('/arrivals/-Nkey.json');
        expect(url.searchParams.get('print')).toBe('silent');
        expect(init.method).toBe('PATCH');
        expect(JSON.parse(init.body)).toEqual({ paymentMethod: null });
      });

      it('encodes path segments', async () => {
        const { client, call } = setup();

        await client.write('POST', 'a b/c?d', {}, PILOT);

        expect(call(0).url.pathname).toBe('/a%20b/c%3Fd.json');
      });

      it('passes the namespace of the database URL', async () => {
        const { client, call } = setup({ app: fakeApp('http://localhost:9000?ns=demo-x') });

        await client.write('POST', 'departures', {}, PILOT);

        expect(call(0).url.searchParams.get('ns')).toBe('demo-x');
      });

      it('reuses the access token until shortly before it expires', async () => {
        let time = 0;
        const { client, call, app } = setup({ now: () => time });

        await client.write('POST', 'departures', {}, PILOT);
        time = 54 * 60 * 1000;
        await client.write('POST', 'departures', {}, PILOT);
        time = 56 * 60 * 1000;
        await client.write('POST', 'departures', {}, PILOT);

        expect(app.options.credential.getAccessToken).toHaveBeenCalledTimes(2);
        expect(call(1).init.headers.Authorization).toBe('Bearer access-1');
        expect(call(2).init.headers.Authorization).toBe('Bearer access-2');
      });

      it('talks to the emulator as its owner, without the credential', async () => {
        const { client, call, app } = setup({ env: { FIREBASE_DATABASE_EMULATOR_HOST: '127.0.0.1:9000' } });

        await client.write('POST', 'departures', {}, { uid: 'guest', token: {} });

        const { url, init } = call(0);
        expect(url.origin).toBe('http://127.0.0.1:9000');
        expect(url.searchParams.get('ns')).toBe('lsze-test');
        expect(JSON.parse(url.searchParams.get('auth_variable_override'))).toEqual({ uid: 'guest', token: {} });
        expect(init.headers.Authorization).toBe('Bearer owner');
        expect(app.options.credential.getAccessToken).not.toHaveBeenCalled();
      });

      it.each([
        ['no override', undefined],
        ['null', null],
        ['no uid', { token: { email: 'pilot@example.com' } }],
        ['an empty uid', { uid: '' }],
        ['a string', 'pilot-uid'],
      ])('never writes without a caller (%s)', async (_, authOverride) => {
        const { client, fetchImpl } = setup();

        await expect(client.write('POST', 'departures', {}, authOverride)).rejects.toThrow(TypeError);
        expect(fetchImpl).not.toHaveBeenCalled();
      });

      it.each([
        '{\n  "error" : "Permission denied"\n}\n',
        { error: 'permission denied' },
      ])('reports a rules denial (%j) as RulesRejectedError', async body => {
        const { client } = setup({ answer: response(401, body) });

        const error = await client.write('PATCH', 'departures/-Nkey', {}, PILOT).catch(e => e);

        expect(error).toBeInstanceOf(RulesRejectedError);
        expect(error.path).toBe('departures/-Nkey');
      });

      it.each([
        [401, { error: 'Unauthorized request.' }],
        [401, 'not json'],
        [400, { error: 'Invalid data; couldn\'t parse JSON object' }],
        [403, { error: 'Permission denied' }],
        [500, undefined],
        [503, { error: 'Service unavailable' }],
      ])('reports %i %j as DatabaseRestError', async (status, body) => {
        const { client } = setup({ answer: response(status, body) });

        const error = await client.write('POST', 'departures', {}, PILOT).catch(e => e);

        expect(error).toBeInstanceOf(DatabaseRestError);
        expect(error).not.toBeInstanceOf(RulesRejectedError);
        expect(error.status).toBe(status);
        expect(error.message).not.toContain('access-1');
      });

      it('reports network failures and timeouts as DatabaseRestError', async () => {
        const { client } = setup({
          answer: () => {
            throw new DOMException('The operation was aborted due to timeout', 'TimeoutError');
          },
        });

        const error = await client.write('POST', 'departures', {}, PILOT).catch(e => e);

        expect(error).toBeInstanceOf(DatabaseRestError);
        expect(error.message).toContain('TimeoutError');
      });

      it('reports a missing credential as DatabaseRestError', async () => {
        const { client } = setup({ app: { options: { databaseURL: 'https://lsze-test.firebaseio.com' } } });

        await expect(client.write('POST', 'departures', {}, PILOT)).rejects.toThrow(DatabaseRestError);
      });
    });

    describe('read', () => {
      it('queries as the caller with JSON-encoded parameters', async () => {
        const { client, call } = setup({ answer: response(200, { k1: { immatriculation: 'HBPIV' } }) });

        const answer = await client.read('arrivals', {
          orderBy: 'createdBy_orderKey', startAt: 'pilot@example.com_1', endAt: 'pilot@example.com_2', limitToFirst: 201,
        }, PILOT);

        expect(answer).toEqual({ k1: { immatriculation: 'HBPIV' } });
        const { url, init } = call(0);
        expect(url.pathname).toBe('/arrivals.json');
        expect(init.method).toBe('GET');
        expect(init.headers.Authorization).toBe('Bearer access-1');
        expect(JSON.parse(url.searchParams.get('auth_variable_override'))).toEqual(PILOT);
        expect(url.searchParams.get('orderBy')).toBe('"createdBy_orderKey"');
        expect(url.searchParams.get('startAt')).toBe('"pilot@example.com_1"');
        expect(url.searchParams.get('limitToFirst')).toBe('201');
      });

      it('never reads without a caller', async () => {
        const { client, fetchImpl } = setup();

        await expect(client.read('arrivals', {}, { uid: '' })).rejects.toThrow(TypeError);
        expect(fetchImpl).not.toHaveBeenCalled();
      });

      it('reports a rules denial as RulesRejectedError and other failures as DatabaseRestError', async () => {
        const denied = await setup({ answer: response(401, { error: 'Permission denied' }) })
          .client.read('arrivals', {}, PILOT).catch(e => e);
        expect(denied).toBeInstanceOf(RulesRejectedError);
        expect(denied.message).toBe('Database rules rejected the read of arrivals');

        const failed = await setup({ answer: response(500) }).client.read('arrivals', {}, PILOT).catch(e => e);
        expect(failed).toBeInstanceOf(DatabaseRestError);
        expect(failed.status).toBe(500);
      });
    });
  });
});
