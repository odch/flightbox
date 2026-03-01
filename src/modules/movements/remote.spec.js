jest.mock('../../util/firebase');

import firebase from '../../util/firebase';
import {loadLimited, loadByKey, removeMovement, saveMovement, addMovementAssociationListener, removeMovementAssociationListener} from './remote';

describe('modules', () => {
  describe('movements/remote', () => {
    let mockRef;

    beforeEach(() => {
      mockRef = {
        orderByChild: jest.fn().mockReturnThis(),
        startAt: jest.fn().mockReturnThis(),
        limitToFirst: jest.fn().mockReturnThis(),
        endAt: jest.fn().mockReturnThis(),
        once: jest.fn(),
        child: jest.fn().mockReturnThis(),
        remove: jest.fn().mockResolvedValue(),
        update: jest.fn().mockResolvedValue(),
        push: jest.fn().mockResolvedValue({key: 'new-key'}),
        on: jest.fn(),
        off: jest.fn(),
      };
      firebase.mockReturnValue(mockRef);
    });

    describe('loadLimited', () => {
      it('resolves with snapshot and ref', async () => {
        const mockSnapshot = {val: () => ({})};
        mockRef.once.mockImplementation((event, cb) => cb(mockSnapshot));

        const result = await loadLimited('/departures', null, 10, null, null);
        expect(result).toHaveProperty('snapshot', mockSnapshot);
        expect(result).toHaveProperty('ref');
        expect(mockRef.limitToFirst).toHaveBeenCalledWith(10);
      });

      it('uses endAt when no limit provided', async () => {
        const mockSnapshot = {val: () => ({})};
        mockRef.once.mockImplementation((event, cb) => cb(mockSnapshot));

        await loadLimited('/departures', null, null, 'endVal', null);
        expect(mockRef.endAt).toHaveBeenCalled();
      });

      it('uses createdBy ordering when provided', async () => {
        const mockSnapshot = {val: () => ({})};
        mockRef.once.mockImplementation((event, cb) => cb(mockSnapshot));

        await loadLimited('/departures', null, 5, null, 'user123');
        expect(mockRef.orderByChild).toHaveBeenCalledWith('createdBy_orderKey');
      });
    });

    describe('loadByKey', () => {
      it('resolves with snapshot', async () => {
        const mockSnapshot = {val: () => ({immatriculation: 'HBKOF'})};
        mockRef.once.mockImplementation((event, cb) => cb(mockSnapshot));

        const result = await loadByKey('/departures', 'key123');
        expect(result).toBe(mockSnapshot);
      });
    });

    describe('removeMovement', () => {
      it('resolves when firebase remove succeeds', async () => {
        await expect(removeMovement('/departures', 'key123')).resolves.toBeUndefined();
        expect(mockRef.child).toHaveBeenCalledWith('key123');
        expect(mockRef.remove).toHaveBeenCalled();
      });

      it('rejects when firebase remove fails', async () => {
        mockRef.remove.mockRejectedValue(new Error('Permission denied'));
        await expect(removeMovement('/departures', 'key123')).rejects.toThrow('Permission denied');
      });
    });

    describe('saveMovement', () => {
      it('updates existing movement when key is provided', async () => {
        const result = await saveMovement('/departures', 'existing-key', {immatriculation: 'HBKOF'});
        expect(mockRef.child).toHaveBeenCalledWith('existing-key');
        expect(mockRef.update).toHaveBeenCalled();
        expect(result).toBe('existing-key');
      });

      it('pushes new movement when no key provided', async () => {
        const result = await saveMovement('/departures', null, {immatriculation: 'HBKOF'});
        expect(mockRef.push).toHaveBeenCalled();
        expect(result).toBe('new-key');
      });

      it('rejects when firebase operation fails', async () => {
        mockRef.update.mockRejectedValue(new Error('Save failed'));
        await expect(saveMovement('/departures', 'key', {})).rejects.toThrow('Save failed');
      });
    });

    describe('addMovementAssociationListener', () => {
      it('listens on correct firebase path for departure', () => {
        const cb = jest.fn();
        addMovementAssociationListener('departure', 'dep-key', cb);
        expect(mockRef.child).toHaveBeenCalledWith('departures');
        expect(mockRef.on).toHaveBeenCalledWith('value', cb);
      });

      it('listens on correct firebase path for arrival', () => {
        const cb = jest.fn();
        addMovementAssociationListener('arrival', 'arr-key', cb);
        expect(mockRef.child).toHaveBeenCalledWith('arrivals');
      });
    });

    describe('removeMovementAssociationListener', () => {
      it('removes listener for departure', () => {
        removeMovementAssociationListener('departure', 'dep-key');
        expect(mockRef.child).toHaveBeenCalledWith('departures');
        expect(mockRef.off).toHaveBeenCalledWith('value');
      });

      it('removes listener for arrival', () => {
        removeMovementAssociationListener('arrival', 'arr-key');
        expect(mockRef.child).toHaveBeenCalledWith('arrivals');
      });
    });
  });
});
