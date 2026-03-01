jest.mock('./firebase');

import firebase from './firebase';
import importCsv from './importCsv';

describe('util', () => {
  describe('importCsv', () => {
    let mockRef;

    beforeEach(() => {
      jest.clearAllMocks();

      mockRef = {
        once: jest.fn(),
        child: jest.fn(),
        push: jest.fn(),
        remove: jest.fn(),
        set: jest.fn(),
      };

      // Default child mock returns a ref with set/remove
      mockRef.child.mockReturnValue({
        set: jest.fn(),
        remove: jest.fn(),
      });

      // Default: firebase called with callback -> calls callback(null, mockRef)
      //          firebase called without callback -> returns mockRef
      firebase.mockImplementation((path, callback) => {
        if (typeof callback === 'function') {
          callback(null, mockRef);
        } else {
          return mockRef;
        }
      });

      // Default once: with callback arg (updateExisting pattern) -> call it with empty snapshot
      //               without callback (additionalEntriesPath) -> return Promise with non-existing snapshot
      mockRef.once.mockImplementation((event, cb) => {
        if (typeof cb === 'function') {
          cb({ forEach: () => {} });
        } else {
          return Promise.resolve({ exists: () => false, val: () => null });
        }
      });
    });

    const baseOptions = {
      path: '/users',
      columns: [
        { csv: 'UserName', firebase: 'memberNr', isKey: true },
        { csv: 'LastName', firebase: 'lastname' },
        { csv: 'FirstName', firebase: 'firstname' },
      ],
    };

    const csvString =
      'UserName,LastName,FirstName\n' +
      '1001,Smith,John\n' +
      '1002,Doe,Jane\n';

    describe('basic flow', () => {
      it('calls firebase with options.path', async () => {
        await importCsv(csvString, baseOptions);
        expect(firebase).toHaveBeenCalledWith('/users');
      });

      it('resolves after processing', async () => {
        await expect(importCsv(csvString, baseOptions)).resolves.toBeUndefined();
      });
    });

    describe('updateExisting - removes items absent from CSV', () => {
      it('removes firebase entries whose key is not in CSV', async () => {
        const childRef = { set: jest.fn(), remove: jest.fn() };
        mockRef.child.mockReturnValue(childRef);

        mockRef.once.mockImplementation((event, cb) => {
          if (typeof cb === 'function') {
            // memberNr '9999' is not in the CSV (which has '1001' and '1002')
            cb({
              forEach: fn =>
                fn({ key: 'existingFirebaseKey', val: () => ({ memberNr: '9999' }) }),
            });
          } else {
            return Promise.resolve({ exists: () => false, val: () => null });
          }
        });

        await importCsv(csvString, baseOptions);

        expect(childRef.remove).toHaveBeenCalled();
      });
    });

    describe('updateExisting - sets matching items', () => {
      it('sets firebase entries that are in CSV', async () => {
        const childRef = { set: jest.fn(), remove: jest.fn() };
        mockRef.child.mockReturnValue(childRef);

        mockRef.once.mockImplementation((event, cb) => {
          if (typeof cb === 'function') {
            // memberNr '1001' is in the CSV
            cb({
              forEach: fn =>
                fn({ key: 'someFirebaseKey', val: () => ({ memberNr: '1001' }) }),
            });
          } else {
            return Promise.resolve({ exists: () => false, val: () => null });
          }
        });

        await importCsv(csvString, baseOptions);

        expect(childRef.set).toHaveBeenCalledWith(
          expect.objectContaining({ memberNr: '1001', lastname: 'Smith', firstname: 'John' })
        );
      });
    });

    describe('addNew with isFirebaseKey', () => {
      it('uses child(key).set when isFirebaseKey is true', async () => {
        const childRef = { set: jest.fn(), remove: jest.fn() };
        mockRef.child.mockReturnValue(childRef);

        const options = {
          path: '/users',
          columns: [
            { csv: 'UserName', firebase: 'memberNr', isKey: true, isFirebaseKey: true },
            { csv: 'LastName', firebase: 'lastname' },
          ],
        };

        const csv = 'UserName,LastName\n1001,Smith\n';
        await importCsv(csv, options);

        expect(mockRef.child).toHaveBeenCalledWith('1001');
        expect(childRef.set).toHaveBeenCalled();
      });
    });

    describe('addNew without isFirebaseKey', () => {
      it('uses push when isFirebaseKey is false or absent', async () => {
        const csv = 'UserName,LastName\n1001,Smith\n';
        const options = {
          path: '/users',
          columns: [
            { csv: 'UserName', firebase: 'memberNr', isKey: true },
            { csv: 'LastName', firebase: 'lastname' },
          ],
        };

        await importCsv(csv, options);

        expect(mockRef.push).toHaveBeenCalled();
      });
    });

    describe('modifications', () => {
      it('applies uppercase modification', async () => {
        const childRef = { set: jest.fn(), remove: jest.fn() };
        mockRef.child.mockReturnValue(childRef);

        const csv = 'UserName,LastName\nabc123,smith\n';
        const options = {
          path: '/users',
          columns: [
            { csv: 'UserName', firebase: 'memberNr', isKey: true, isFirebaseKey: true },
            { csv: 'LastName', firebase: 'lastname', modifications: ['uppercase'] },
          ],
        };

        await importCsv(csv, options);

        expect(childRef.set).toHaveBeenCalledWith(
          expect.objectContaining({ lastname: 'SMITH' })
        );
      });

      it('applies lowercase modification', async () => {
        const childRef = { set: jest.fn(), remove: jest.fn() };
        mockRef.child.mockReturnValue(childRef);

        const csv = 'UserName,Email\nabc123,TEST@EXAMPLE.COM\n';
        const options = {
          path: '/users',
          columns: [
            { csv: 'UserName', firebase: 'memberNr', isKey: true, isFirebaseKey: true },
            { csv: 'Email', firebase: 'email', modifications: ['lowercase'] },
          ],
        };

        await importCsv(csv, options);

        expect(childRef.set).toHaveBeenCalledWith(
          expect.objectContaining({ email: 'test@example.com' })
        );
      });

      it('applies parseint modification', async () => {
        const childRef = { set: jest.fn(), remove: jest.fn() };
        mockRef.child.mockReturnValue(childRef);

        const csv = 'UserName,Age\nabc123,42\n';
        const options = {
          path: '/users',
          columns: [
            { csv: 'UserName', firebase: 'memberNr', isKey: true, isFirebaseKey: true },
            { csv: 'Age', firebase: 'age', modifications: ['parseint'] },
          ],
        };

        await importCsv(csv, options);

        expect(childRef.set).toHaveBeenCalledWith(
          expect.objectContaining({ age: 42 })
        );
      });

      it('throws on unsupported modification', async () => {
        const csv = 'UserName,Name\nabc,foo\n';
        const options = {
          path: '/users',
          columns: [
            { csv: 'UserName', firebase: 'memberNr', isKey: true, isFirebaseKey: true },
            { csv: 'Name', firebase: 'name', modifications: ['invalid'] },
          ],
        };

        await expect(importCsv(csv, options)).rejects.toThrow(
          'Unsupported modification "invalid"'
        );
      });
    });

    describe('missing required CSV column', () => {
      it('throws when a required column header is missing', async () => {
        const csv = 'WrongCol,LastName\n1001,Smith\n';

        await expect(importCsv(csv, baseOptions)).rejects.toThrow(
          'Required column "UserName" not found in row'
        );
      });
    });

    describe('additionalEntriesPath', () => {
      it('merges additional entries from firebase when snapshot exists', async () => {
        const childRef = { set: jest.fn(), remove: jest.fn() };
        mockRef.child.mockReturnValue(childRef);

        const additionalRef = {
          once: jest.fn().mockResolvedValue({
            exists: () => true,
            val: () => ({ extra1: { memberNr: 'extra', lastname: 'Extra' } }),
          }),
        };

        firebase.mockImplementation((path, callback) => {
          if (typeof callback === 'function') {
            callback(null, mockRef);
          } else {
            if (path === '/settings/extra') {
              return additionalRef;
            }
            return mockRef;
          }
        });

        // updateExisting fires callback
        mockRef.once.mockImplementation((event, cb) => {
          if (typeof cb === 'function') {
            cb({ forEach: () => {} });
          } else {
            return Promise.resolve({ exists: () => false, val: () => null });
          }
        });

        const options = {
          path: '/users',
          additionalEntriesPath: '/settings/extra',
          columns: [
            { csv: 'UserName', firebase: 'memberNr', isKey: true },
            { csv: 'LastName', firebase: 'lastname' },
          ],
        };

        const csv = 'UserName,LastName\n1001,Smith\n';
        await importCsv(csv, options);

        // Both CSV entry and additional entry should be pushed (new, not existing)
        expect(mockRef.push).toHaveBeenCalledTimes(2);
      });

      it('does not merge when additional entries snapshot does not exist', async () => {
        const additionalRef = {
          once: jest.fn().mockResolvedValue({
            exists: () => false,
            val: () => null,
          }),
        };

        firebase.mockImplementation((path, callback) => {
          if (typeof callback === 'function') {
            callback(null, mockRef);
          } else {
            if (path === '/settings/extra') {
              return additionalRef;
            }
            return mockRef;
          }
        });

        mockRef.once.mockImplementation((event, cb) => {
          if (typeof cb === 'function') {
            cb({ forEach: () => {} });
          } else {
            return Promise.resolve({ exists: () => false, val: () => null });
          }
        });

        const options = {
          path: '/users',
          additionalEntriesPath: '/settings/extra',
          columns: [
            { csv: 'UserName', firebase: 'memberNr', isKey: true },
            { csv: 'LastName', firebase: 'lastname' },
          ],
        };

        const csv = 'UserName,LastName\n1001,Smith\n';
        await importCsv(csv, options);

        // Only the CSV entry should be pushed
        expect(mockRef.push).toHaveBeenCalledTimes(1);
      });
    });

    describe('column without firebase mapping', () => {
      it('skips columns that have no firebase property', async () => {
        const csv = 'UserName,LastName\n1001,Smith\n';
        const options = {
          path: '/users',
          columns: [
            { csv: 'UserName', isKey: true },
            { csv: 'LastName', firebase: 'lastname' },
          ],
        };

        await importCsv(csv, options);
        expect(mockRef.push).toHaveBeenCalled();
      });
    });
  });
});
