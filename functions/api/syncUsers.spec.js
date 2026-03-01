'use strict';

const syncUsers = require('./syncUsers');

describe('functions/api/syncUsers', () => {
  const buildFirebaseMock = (existingUsersObj = {}) => {
    const mockPush = jest.fn().mockResolvedValue({ key: 'new-generated-key' });
    const mockRemove = jest.fn().mockResolvedValue();
    const mockUpdate = jest.fn().mockResolvedValue();
    const mockOnce = jest.fn().mockResolvedValue({
      val: () => existingUsersObj
    });
    const mockChild = jest.fn(() => ({ remove: mockRemove }));

    const usersRef = {
      once: mockOnce,
      push: mockPush,
      update: mockUpdate,
      child: mockChild
    };

    const firebase = {
      ref: jest.fn(() => usersRef)
    };

    return { firebase, usersRef, mockPush, mockRemove, mockUpdate, mockChild };
  };

  describe('mapUsersByMemberNr', () => {
    it('adds new user when memberNr not in current users', async () => {
      const { firebase, mockPush } = buildFirebaseMock({});

      await syncUsers(firebase, [
        { memberNr: '001', firstname: 'Alice', lastname: 'Smith' }
      ]);

      expect(mockPush).toHaveBeenCalledWith(
        expect.objectContaining({ memberNr: '001', firstname: 'Alice' })
      );
    });

    it('ignores imported users without memberNr', async () => {
      const { firebase, mockPush, mockUpdate } = buildFirebaseMock({});

      await syncUsers(firebase, [
        { firstname: 'NoMember', lastname: 'User' } // no memberNr
      ]);

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('fetchCurrentUsers', () => {
    it('builds user map keyed by memberNr from database snapshot', async () => {
      const existingUsers = {
        'firebase-id-1': { memberNr: '001', firstname: 'Alice' },
        'firebase-id-2': { memberNr: '002', firstname: 'Bob' }
      };
      const { firebase, mockUpdate } = buildFirebaseMock(existingUsers);

      // Import same users - should result in updates (same memberNr)
      await syncUsers(firebase, [
        { memberNr: '001', firstname: 'Alice Updated' },
        { memberNr: '002', firstname: 'Bob Updated' }
      ]);

      // Should update by firebase ID (not push new ones)
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          'firebase-id-1': expect.objectContaining({ memberNr: '001', firstname: 'Alice Updated' }),
          'firebase-id-2': expect.objectContaining({ memberNr: '002', firstname: 'Bob Updated' })
        })
      );
    });

    it('skips existing users without memberNr during lookup build', async () => {
      // Users without memberNr in the database are excluded from the map
      const existingUsers = {
        'firebase-id-1': { firstname: 'NoMember' } // no memberNr
      };
      const { firebase, mockPush } = buildFirebaseMock(existingUsers);

      // New import with memberNr - should push since existing user has no memberNr for lookup
      await syncUsers(firebase, [
        { memberNr: '999', firstname: 'New User' }
      ]);

      expect(mockPush).toHaveBeenCalledWith(
        expect.objectContaining({ memberNr: '999' })
      );
    });

    it('handles null database value (empty database)', async () => {
      const mockOnce = jest.fn().mockResolvedValue({ val: () => null });
      const mockPush = jest.fn().mockResolvedValue({});
      const mockUpdate = jest.fn().mockResolvedValue();
      const mockChild = jest.fn(() => ({ remove: jest.fn() }));

      const usersRef = { once: mockOnce, push: mockPush, update: mockUpdate, child: mockChild };
      const firebase = { ref: jest.fn(() => usersRef) };

      await syncUsers(firebase, [{ memberNr: '001', firstname: 'Alice' }]);

      expect(mockPush).toHaveBeenCalled();
    });
  });

  describe('buildUpdatesAndDeletes', () => {
    it('updates existing user by firebase ID', async () => {
      const existingUsers = {
        'fb-id-1': { memberNr: '001', firstname: 'Alice', lastname: 'Old' }
      };
      const { firebase, mockUpdate } = buildFirebaseMock(existingUsers);

      await syncUsers(firebase, [
        { memberNr: '001', firstname: 'Alice', lastname: 'New' }
      ]);

      const updateArg = mockUpdate.mock.calls[0][0];
      expect(updateArg['fb-id-1']).toEqual(
        expect.objectContaining({ memberNr: '001', lastname: 'New' })
      );
    });

    it('creates placeholder key for new user', async () => {
      const { firebase, mockUpdate, mockPush } = buildFirebaseMock({});

      await syncUsers(firebase, [
        { memberNr: '123', firstname: 'New User' }
      ]);

      // New user should be pushed (not in batch update)
      expect(mockPush).toHaveBeenCalledWith(
        expect.objectContaining({ memberNr: '123' })
      );
    });

    it('deletes users not in imported list', async () => {
      const existingUsers = {
        'fb-id-old': { memberNr: '999', firstname: 'OldUser' }
      };
      const { firebase, mockChild, mockRemove } = buildFirebaseMock(existingUsers);

      // Import does NOT include memberNr 999
      await syncUsers(firebase, [
        { memberNr: '001', firstname: 'NewUser' }
      ]);

      expect(mockChild).toHaveBeenCalledWith('fb-id-old');
      expect(mockRemove).toHaveBeenCalled();
    });

    it('handles empty imported users list (deletes all existing)', async () => {
      const existingUsers = {
        'fb-id-1': { memberNr: '001', firstname: 'Alice' }
      };
      const { firebase, mockChild, mockRemove } = buildFirebaseMock(existingUsers);

      await syncUsers(firebase, []);

      expect(mockChild).toHaveBeenCalledWith('fb-id-1');
      expect(mockRemove).toHaveBeenCalled();
    });

    it('handles empty existing users (adds all imported)', async () => {
      const { firebase, mockPush } = buildFirebaseMock({});

      await syncUsers(firebase, [
        { memberNr: '001', firstname: 'Alice' },
        { memberNr: '002', firstname: 'Bob' }
      ]);

      expect(mockPush).toHaveBeenCalledTimes(2);
    });
  });

  describe('applyUpdatesAndDeletes', () => {
    it('calls update with batch of existing user updates', async () => {
      const existingUsers = {
        'fb-id-1': { memberNr: '001', firstname: 'Alice' },
        'fb-id-2': { memberNr: '002', firstname: 'Bob' }
      };
      const { firebase, mockUpdate } = buildFirebaseMock(existingUsers);

      await syncUsers(firebase, [
        { memberNr: '001', firstname: 'Alice v2' },
        { memberNr: '002', firstname: 'Bob v2' }
      ]);

      expect(mockUpdate).toHaveBeenCalledTimes(1);
      const batchArg = mockUpdate.mock.calls[0][0];
      expect(batchArg['fb-id-1']).toBeDefined();
      expect(batchArg['fb-id-2']).toBeDefined();
    });

    it('calls usersRef.ref with "users" path', async () => {
      const { firebase } = buildFirebaseMock({});

      await syncUsers(firebase, []);

      expect(firebase.ref).toHaveBeenCalledWith('users');
    });

    it('handles mix of new and existing users', async () => {
      const existingUsers = {
        'fb-id-1': { memberNr: '001', firstname: 'Alice' }
      };
      const { firebase, mockPush, mockUpdate } = buildFirebaseMock(existingUsers);

      await syncUsers(firebase, [
        { memberNr: '001', firstname: 'Alice Updated' }, // existing
        { memberNr: '002', firstname: 'Bob New' }         // new
      ]);

      // Existing gets updated via batch
      const batchArg = mockUpdate.mock.calls[0][0];
      expect(batchArg['fb-id-1']).toBeDefined();

      // New gets pushed
      expect(mockPush).toHaveBeenCalledWith(
        expect.objectContaining({ memberNr: '002' })
      );
    });
  });
});
