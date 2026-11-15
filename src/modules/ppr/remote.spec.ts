import { loadRequestStatus, submitGuestRequest, withdrawRequest } from './remote';

const API = 'https://europe-west1-test-project.cloudfunctions.net/api';
const TOKEN = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJ-_0123';

// The parts of a fetch Response the remote reads (jsdom has no Response)
const response = (status: number, body: unknown, headers: Record<string, string> = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: (name: string) => headers[name] ?? null },
  json: () => body === undefined ? Promise.reject(new SyntaxError('Unexpected end of JSON input')) : Promise.resolve(body),
});

describe('modules', () => {
  describe('ppr', () => {
    describe('remote', () => {
      let fetchMock: jest.Mock;

      beforeEach(() => {
        (global as any).__FIREBASE_PROJECT_ID__ = 'test-project';
        fetchMock = jest.fn();
        (global as any).fetch = fetchMock;
      });

      const sent = () => {
        const [url, init] = fetchMock.mock.calls[0];
        return { url, init, body: JSON.parse(init.body) };
      };

      describe('submitGuestRequest', () => {
        it('sends the request as JSON, without an ID token, and returns the answer', async () => {
          const answer = { key: '-Nabc', status: 'pending', statusToken: TOKEN };
          fetchMock.mockResolvedValue(response(201, answer));

          await expect(submitGuestRequest({ email: 'pilot@example.com', language: 'en' })).resolves.toEqual(answer);

          const { url, init, body } = sent();
          expect(url).toBe(`${API}/ppr/guest-requests`);
          expect(init.method).toBe('POST');
          expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
          expect(body).toEqual({ email: 'pilot@example.com', language: 'en' });
        });

        it('keeps the status and the waiting time of a refusal for too many requests', async () => {
          fetchMock.mockResolvedValue(response(429, { error: 'Too many requests' }, { 'Retry-After': '1800' }));

          await expect(submitGuestRequest({})).rejects.toMatchObject({
            message: 'Too many requests',
            status: 429,
            retryAfterSeconds: 1800,
          });
        });

        it('has no waiting time when the browser may not read it', async () => {
          fetchMock.mockResolvedValue(response(429, { error: 'Too many requests' }));

          const error = await submitGuestRequest({}).catch(e => e);
          expect(error.status).toBe(429);
          expect(error).not.toHaveProperty('retryAfterSeconds');
        });

        it('keeps the status of a refusal without a JSON body', async () => {
          fetchMock.mockResolvedValue(response(415, undefined));

          await expect(submitGuestRequest({})).rejects.toMatchObject({ message: 'Request failed: 415', status: 415 });
        });
      });

      describe('loadRequestStatus', () => {
        it('sends the token in the body, not in the URL', async () => {
          const status = { status: 'pending', immatriculation: 'HBKOF', canWithdraw: true };
          fetchMock.mockResolvedValue(response(200, status));

          await expect(loadRequestStatus('-Nabc_1', TOKEN)).resolves.toEqual(status);

          const { url, init, body } = sent();
          expect(url).toBe(`${API}/ppr/status/-Nabc_1`);
          expect(init.method).toBe('POST');
          expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
          expect(body).toEqual({ token: TOKEN });
        });

        it('encodes the key', async () => {
          fetchMock.mockResolvedValue(response(200, {}));

          await loadRequestStatus('a/b?c', TOKEN);

          expect(sent().url).toBe(`${API}/ppr/status/a%2Fb%3Fc`);
        });

        it('keeps the status of a link that leads to no request', async () => {
          fetchMock.mockResolvedValue(response(404, { error: 'Not found' }));

          await expect(loadRequestStatus('-Nabc', TOKEN)).rejects.toMatchObject({ status: 404 });
        });
      });

      describe('withdrawRequest', () => {
        it('withdraws with the token in the body', async () => {
          fetchMock.mockResolvedValue(response(200, { withdrawn: true }));

          await expect(withdrawRequest('-Nabc', TOKEN)).resolves.toEqual({ withdrawn: true });

          const { url, init, body } = sent();
          expect(url).toBe(`${API}/ppr/status/-Nabc/withdraw`);
          expect(init.method).toBe('POST');
          expect(body).toEqual({ token: TOKEN });
        });

        it('keeps the status of a request answered in the meantime', async () => {
          fetchMock.mockResolvedValue(response(409, { error: 'Not pending' }));

          await expect(withdrawRequest('-Nabc', TOKEN)).rejects.toMatchObject({ message: 'Not pending', status: 409 });
        });
      });
    });
  });
});
