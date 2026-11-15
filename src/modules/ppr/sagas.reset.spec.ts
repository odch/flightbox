import { runSaga, stdChannel } from 'redux-saga';
import * as actions from './actions';
import * as sagas from './sagas';
import * as remote from './remote';
import reducer from './reducer';
import { getIdToken } from '../../util/firebase';

jest.mock('./remote');
jest.mock('../../util/firebase', () => ({ getIdToken: jest.fn() }));
jest.mock('../../history', () => ({ history: { push: jest.fn() } }));
jest.mock('../../i18n', () => ({ language: 'de' }));

const mockedRemote = remote as jest.Mocked<typeof remote>;
const mockedGetIdToken = getIdToken as jest.MockedFunction<typeof getIdToken>;

// A remote call that answers when the test says so
function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>(res => {
    resolve = res;
  });
  return { promise, resolve };
}

// Runs a saga with the real runtime against the real reducer, as the store
// does: actions put by the saga and dispatched by the test reach both
function run(saga: (action: any) => Generator, action: any) {
  const channel = stdChannel();
  let state = reducer(undefined, { type: '@@INIT' } as any);
  const dispatch = (dispatched: any) => {
    state = reducer(state, dispatched);
    channel.put(dispatched);
  };
  dispatch(action);
  const task = runSaga({ channel, dispatch, getState: () => state }, saga, action);
  return { task, dispatch, state: () => state };
}

const pending = {
  status: 'pending', immatriculation: 'HBKOF', plannedDate: '2026-11-20', plannedTime: '10:30',
  flightType: 'private', automatic: false, canWithdraw: true,
};

describe('PPR sagas: answers that come after the page was left', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('leave no notice of a withdrawal for the next status page', async () => {
    const withdrawal = deferred<{ withdrawn: true }>();
    mockedRemote.withdrawRequest.mockReturnValue(withdrawal.promise);

    const { task, dispatch, state } = run(sagas.withdrawPprRequest, actions.withdrawPprRequest('A', 'token-a'));
    dispatch(actions.resetPprStatus());
    withdrawal.resolve({ withdrawn: true });
    await task.toPromise();

    expect(state().status).toEqual({ request: null, loading: false, withdrawing: false, notice: null });
  });

  it('leave no request or failure of a load for the next status page', async () => {
    const load = deferred<typeof pending>();
    mockedRemote.loadRequestStatus.mockReturnValue(load.promise);

    const { task, dispatch, state } = run(sagas.loadPprStatus, actions.loadPprStatus('A', 'token-a'));
    dispatch(actions.resetPprStatus());
    load.resolve(pending);
    await task.toPromise();

    expect(state().status.request).toBeNull();
    expect(state().status.notice).toBeNull();
  });

  it('show a status that comes while the page is open', async () => {
    mockedRemote.loadRequestStatus.mockResolvedValue(pending);

    const { task, state } = run(sagas.loadPprStatus, actions.loadPprStatus('A', 'token-a'));
    await task.toPromise();

    expect(state().status.request).toEqual(pending);
    expect(state().status.loading).toBe(false);
  });

  it('send no request of a login whose form was left while its ID token came', async () => {
    const idToken = deferred<string>();
    mockedGetIdToken.mockReturnValue(idToken.promise);

    const { task, dispatch, state } = run(sagas.submitPprRequest, actions.submitPprRequest({ firstname: 'Max' }));
    dispatch(actions.resetPprForm());
    idToken.resolve('token-1');
    await task.toPromise();

    expect(mockedRemote.submitRequest).not.toHaveBeenCalled();
    expect(state().form.submitted).toBe(false);
    expect(state().form.commitFailed).toBe(false);
  });

  it('open no result dialog of a login\'s submission on the next form', async () => {
    mockedGetIdToken.mockResolvedValue('token-1');
    const submission = deferred<actions.PprSubmitResult>();
    mockedRemote.submitRequest.mockReturnValue(submission.promise);

    const { task, dispatch, state } = run(sagas.submitPprRequest, actions.submitPprRequest({ firstname: 'Max' }));
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(mockedRemote.submitRequest).toHaveBeenCalledTimes(1);
    dispatch(actions.resetPprForm());
    submission.resolve({ key: 'K1', status: 'pending', statusToken: 'token-1', emailSent: true });
    await task.toPromise();

    expect(state().form.submitted).toBe(false);
    expect(state().form.result).toBeNull();
  });

  it('open no result dialog of a submission without login on the next form', async () => {
    const submission = deferred<actions.PprSubmitResult>();
    mockedRemote.submitGuestRequest.mockReturnValue(submission.promise);

    const { task, dispatch, state } = run(
      sagas.submitPprGuestRequest,
      actions.submitPprGuestRequest({ email: 'max@example.com' })
    );
    dispatch(actions.resetPprForm());
    submission.resolve({ key: 'K1', status: 'pending', statusToken: 'token-1', emailSent: true });
    await task.toPromise();

    expect(state().form.submitted).toBe(false);
    expect(state().form.result).toBeNull();
    expect(state().form.submitting).toBe(false);
  });
});
