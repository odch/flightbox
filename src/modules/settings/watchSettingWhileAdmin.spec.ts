import {runSaga, stdChannel} from 'redux-saga';
import {onValue} from 'firebase/database';
import firebase, {isSignedIn} from '../../util/firebase';
import {error} from '../../util/log';
import {FIREBASE_AUTHENTICATION_EVENT} from '../auth/actions';
import {watchSettingWhileAdmin} from './watchSettingWhileAdmin';

jest.mock('../../util/firebase');
jest.mock('../../util/log', () => ({
  error: jest.fn(),
}));
jest.mock('firebase/database', () => ({
  onValue: jest.fn(),
}));

const PATH = '/settings/guestAccessToken';
const loaded = (value: any) => ({type: 'LOADED', payload: {value}});

const authEvent = (authData: any) => ({
  type: FIREBASE_AUTHENTICATION_EVENT,
  payload: {authData},
});
const adminLogin = () => authEvent({uid: 'admin-uid', admin: true});
const userLogin = () => authEvent({uid: 'user-uid', admin: false});
const logout = () => authEvent(null);
// Shaped like the errors Firebase passes to a cancelled listener
const permissionDenied = () => Object.assign(
  new Error(`permission_denied at ${PATH}: Client doesn't have permission to access the desired data.`),
  {code: 'PERMISSION_DENIED'}
);

describe('modules', () => {
  describe('settings', () => {
    describe('watchSettingWhileAdmin', () => {
      let channel: ReturnType<typeof stdChannel>;
      let dispatched: any[];
      let unsubscribe: jest.Mock;
      let task: any;

      const lastListener = () => {
        const calls = (onValue as jest.Mock).mock.calls;
        const [, onData, onCancel] = calls[calls.length - 1];
        return {onData, onCancel};
      };
      const emit = (action: any) => channel.put(action);

      beforeEach(() => {
        jest.clearAllMocks();
        (firebase as jest.Mock).mockImplementation((path: string) => ({path}));
        (isSignedIn as jest.Mock).mockReturnValue(true);
        unsubscribe = jest.fn();
        (onValue as jest.Mock).mockReturnValue(unsubscribe);

        channel = stdChannel();
        dispatched = [];
        task = runSaga({
          channel,
          dispatch: (action: any) => {
            dispatched.push(action);
            channel.put(action);
          },
        }, watchSettingWhileAdmin, PATH, loaded);
      });

      afterEach(() => {
        task.cancel();
      });

      it('does not subscribe before anyone is authenticated', () => {
        expect(onValue).not.toHaveBeenCalled();
      });

      it('subscribes to the path when an admin signs in', () => {
        emit(adminLogin());

        expect(firebase).toHaveBeenCalledWith(PATH);
        expect(onValue).toHaveBeenCalledTimes(1);
        expect((onValue as jest.Mock).mock.calls[0][0]).toEqual({path: PATH});
      });

      it('dispatches the loaded action for each value', () => {
        emit(adminLogin());
        const {onData} = lastListener();

        onData({val: () => ({token: 'abc'})});
        onData({val: () => null});

        expect(dispatched).toEqual([loaded({token: 'abc'}), loaded(null)]);
      });

      it('does not subscribe a second time on repeated admin events', () => {
        emit(adminLogin());
        emit(adminLogin());

        expect(onValue).toHaveBeenCalledTimes(1);
      });

      it('does not subscribe for non-admin users', () => {
        emit(userLogin());

        expect(onValue).not.toHaveBeenCalled();
        expect(dispatched).toEqual([]);
      });

      it('does nothing on logout when not subscribed', () => {
        emit(logout());

        expect(unsubscribe).not.toHaveBeenCalled();
        expect(dispatched).toEqual([]);
      });

      it('unsubscribes and resets the value on logout', () => {
        emit(adminLogin());
        emit(logout());

        expect(unsubscribe).toHaveBeenCalledTimes(1);
        expect(dispatched).toEqual([loaded(null)]);
      });

      it('unsubscribes and resets the value when a non-admin signs in', () => {
        emit(adminLogin());
        emit(userLogin());

        expect(unsubscribe).toHaveBeenCalledTimes(1);
        expect(dispatched).toEqual([loaded(null)]);
      });

      it('subscribes again when an admin signs in after a logout', () => {
        emit(adminLogin());
        emit(logout());
        emit(adminLogin());

        expect(onValue).toHaveBeenCalledTimes(2);
      });

      it('logs and allows a new subscription when Firebase cancels the listener', () => {
        emit(adminLogin());
        const denied = permissionDenied();
        lastListener().onCancel(denied);

        expect(error).toHaveBeenCalledWith(`Listener for ${PATH} was cancelled`, denied);

        emit(adminLogin());
        expect(onValue).toHaveBeenCalledTimes(2);
      });

      it('does not log a permission_denied cancel after the sign-out', () => {
        emit(adminLogin());
        (isSignedIn as jest.Mock).mockReturnValue(false);
        lastListener().onCancel(permissionDenied());

        expect(error).not.toHaveBeenCalled();

        emit(adminLogin());
        expect(onValue).toHaveBeenCalledTimes(2);
      });

      it('logs other cancels after the sign-out', () => {
        emit(adminLogin());
        (isSignedIn as jest.Mock).mockReturnValue(false);
        const unavailable = Object.assign(new Error('unavailable'), {code: 'UNAVAILABLE'});
        lastListener().onCancel(unavailable);

        expect(error).toHaveBeenCalledWith(`Listener for ${PATH} was cancelled`, unavailable);
      });
    });
  });
});
