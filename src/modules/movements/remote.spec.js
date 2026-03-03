jest.mock('../../util/firebase');
jest.mock('firebase/database', () => ({
  get: jest.fn(),
  child: jest.fn(),
  query: jest.fn(),
  orderByChild: jest.fn(),
  startAt: jest.fn(),
  limitToFirst: jest.fn(),
  endAt: jest.fn(),
  onValue: jest.fn(),
  remove: jest.fn(),
  update: jest.fn(),
  push: jest.fn(),
}));

import firebase from '../../util/firebase';
import {get, child, query, orderByChild, startAt, limitToFirst, endAt, onValue, remove, update, push} from 'firebase/database';
import {loadLimited, loadByKey, removeMovement, saveMovement, addMovementAssociationListener, removeMovementAssociationListener} from './remote';

describe('modules', () => {
  describe('movements/remote', () => {
    let mockRef;
    let queryRef;
    let childRef;
    let mockSnapshot;

    beforeEach(() => {
      jest.clearAllMocks();

      mockRef = {};
      queryRef = {};
      childRef = {};
      mockSnapshot = {val: () => ({})};

      firebase.mockReturnValue(mockRef);
      query.mockReturnValue(queryRef);
      child.mockReturnValue(childRef);
      get.mockResolvedValue(mockSnapshot);
      remove.mockResolvedValue();
      update.mockResolvedValue();
      push.mockResolvedValue({key: 'new-key'});
      onValue.mockReturnValue(jest.fn());
    });

    describe('loadLimited', () => {
      it('resolves with snapshot and ref', async () => {
        const result = await loadLimited('/departures', null, 10, null, null);
        expect(result).toHaveProperty('snapshot', mockSnapshot);
        expect(result).toHaveProperty('ref');
        expect(limitToFirst).toHaveBeenCalledWith(10);
      });

      it('uses endAt when no limit provided', async () => {
        await loadLimited('/departures', null, null, 'endVal', null);
        expect(endAt).toHaveBeenCalled();
      });

      it('uses createdBy ordering when provided', async () => {
        await loadLimited('/departures', null, 5, null, 'user123');
        expect(orderByChild).toHaveBeenCalledWith('createdBy_orderKey');
      });
    });

    describe('loadByKey', () => {
      it('resolves with snapshot', async () => {
        const result = await loadByKey('/departures', 'key123');
        expect(child).toHaveBeenCalledWith(mockRef, 'key123');
        expect(result).toBe(mockSnapshot);
      });
    });

    describe('removeMovement', () => {
      it('resolves when firebase remove succeeds', async () => {
        await expect(removeMovement('/departures', 'key123')).resolves.toBeUndefined();
        expect(child).toHaveBeenCalledWith(mockRef, 'key123');
        expect(remove).toHaveBeenCalledWith(childRef);
      });

      it('rejects when firebase remove fails', async () => {
        remove.mockRejectedValue(new Error('Permission denied'));
        await expect(removeMovement('/departures', 'key123')).rejects.toThrow('Permission denied');
      });
    });

    describe('saveMovement', () => {
      it('updates existing movement when key is provided', async () => {
        const result = await saveMovement('/departures', 'existing-key', {immatriculation: 'HBKOF'});
        expect(child).toHaveBeenCalledWith(mockRef, 'existing-key');
        expect(update).toHaveBeenCalled();
        expect(result).toBe('existing-key');
      });

      it('pushes new movement when no key provided', async () => {
        const result = await saveMovement('/departures', null, {immatriculation: 'HBKOF'});
        expect(push).toHaveBeenCalled();
        expect(result).toBe('new-key');
      });

      it('rejects when firebase operation fails', async () => {
        update.mockRejectedValue(new Error('Save failed'));
        await expect(saveMovement('/departures', 'key', {})).rejects.toThrow('Save failed');
      });
    });

    describe('addMovementAssociationListener', () => {
      it('listens on correct firebase path for departure', () => {
        const cb = jest.fn();
        addMovementAssociationListener('departure', 'dep-key', cb);
        expect(child).toHaveBeenCalledWith(expect.anything(), 'departures');
        expect(onValue).toHaveBeenCalledWith(expect.anything(), cb);
      });

      it('listens on correct firebase path for arrival', () => {
        const cb = jest.fn();
        addMovementAssociationListener('arrival', 'arr-key', cb);
        expect(child).toHaveBeenCalledWith(expect.anything(), 'arrivals');
      });
    });

    describe('removeMovementAssociationListener', () => {
      it('calls unsubscribe function for departure', () => {
        const mockUnsubscribe = jest.fn();
        onValue.mockReturnValue(mockUnsubscribe);

        addMovementAssociationListener('departure', 'dep-key-r1', jest.fn());
        removeMovementAssociationListener('departure', 'dep-key-r1');

        expect(mockUnsubscribe).toHaveBeenCalled();
      });

      it('calls unsubscribe function for arrival', () => {
        const mockUnsubscribe = jest.fn();
        onValue.mockReturnValue(mockUnsubscribe);

        addMovementAssociationListener('arrival', 'arr-key-r1', jest.fn());
        removeMovementAssociationListener('arrival', 'arr-key-r1');

        expect(mockUnsubscribe).toHaveBeenCalled();
      });
    });
  });
});
