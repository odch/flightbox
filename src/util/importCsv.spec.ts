jest.mock('./firebase');
jest.mock('firebase/database', () => ({
  get: jest.fn(),
  child: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
  push: jest.fn(),
}));

import firebase from './firebase';
import {get, child, set, remove, push} from 'firebase/database';
import importCsv from './importCsv';

describe('util', () => {
  describe('importCsv', () => {
    let mockRef;
    let childRef;

    beforeEach(() => {
      jest.clearAllMocks();

      mockRef = {};
      childRef = {};

      (firebase as jest.Mock).mockReturnValue(mockRef);
      (child as jest.Mock).mockReturnValue(childRef);

      // Default: empty snapshot (no existing firebase entries)
      (get as jest.Mock).mockResolvedValue({forEach: () => {}, exists: () => false, val: () => null});
      (set as jest.Mock).mockResolvedValue(undefined);
      (remove as jest.Mock).mockResolvedValue(undefined);
      (push as jest.Mock).mockResolvedValue(undefined);
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
        // memberNr '9999' is not in the CSV (which has '1001' and '1002')
        (get as jest.Mock).mockResolvedValue({
          forEach: fn =>
            fn({key: 'existingFirebaseKey', val: () => ({memberNr: '9999'})}),
        });

        await importCsv(csvString, baseOptions);

        expect(remove).toHaveBeenCalledWith(childRef);
      });
    });

    describe('updateExisting - sets matching items', () => {
      it('sets firebase entries that are in CSV', async () => {
        // memberNr '1001' is in the CSV
        (get as jest.Mock).mockResolvedValue({
          forEach: fn =>
            fn({key: 'someFirebaseKey', val: () => ({memberNr: '1001'})}),
        });

        await importCsv(csvString, baseOptions);

        expect(set).toHaveBeenCalledWith(
          childRef,
          expect.objectContaining({ memberNr: '1001', lastname: 'Smith', firstname: 'John' })
        );
      });
    });

    describe('addNew with isFirebaseKey', () => {
      it('uses child(key).set when isFirebaseKey is true', async () => {
        const options = {
          path: '/users',
          columns: [
            { csv: 'UserName', firebase: 'memberNr', isKey: true, isFirebaseKey: true },
            { csv: 'LastName', firebase: 'lastname' },
          ],
        };

        const csv = 'UserName,LastName\n1001,Smith\n';
        await importCsv(csv, options);

        expect(child).toHaveBeenCalledWith(mockRef, '1001');
        expect(set).toHaveBeenCalled();
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

        expect(push).toHaveBeenCalled();
      });
    });

    describe('modifications', () => {
      it('applies uppercase modification', async () => {
        const csv = 'UserName,LastName\nabc123,smith\n';
        const options = {
          path: '/users',
          columns: [
            { csv: 'UserName', firebase: 'memberNr', isKey: true, isFirebaseKey: true },
            { csv: 'LastName', firebase: 'lastname', modifications: ['uppercase'] },
          ],
        };

        await importCsv(csv, options);

        expect(set).toHaveBeenCalledWith(
          childRef,
          expect.objectContaining({ lastname: 'SMITH' })
        );
      });

      it('applies lowercase modification', async () => {
        const csv = 'UserName,Email\nabc123,TEST@EXAMPLE.COM\n';
        const options = {
          path: '/users',
          columns: [
            { csv: 'UserName', firebase: 'memberNr', isKey: true, isFirebaseKey: true },
            { csv: 'Email', firebase: 'email', modifications: ['lowercase'] },
          ],
        };

        await importCsv(csv, options);

        expect(set).toHaveBeenCalledWith(
          childRef,
          expect.objectContaining({ email: 'test@example.com' })
        );
      });

      it('applies parseint modification', async () => {
        const csv = 'UserName,Age\nabc123,42\n';
        const options = {
          path: '/users',
          columns: [
            { csv: 'UserName', firebase: 'memberNr', isKey: true, isFirebaseKey: true },
            { csv: 'Age', firebase: 'age', modifications: ['parseint'] },
          ],
        };

        await importCsv(csv, options);

        expect(set).toHaveBeenCalledWith(
          childRef,
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
        const options = {
          path: '/users',
          additionalEntriesPath: '/settings/extra',
          columns: [
            { csv: 'UserName', firebase: 'memberNr', isKey: true },
            { csv: 'LastName', firebase: 'lastname' },
          ],
        };

        const csv = 'UserName,LastName\n1001,Smith\n';

        // First get call: additionalEntriesPath snapshot (exists with extra entry)
        // Second get call: updateExisting snapshot (empty)
        (get as jest.Mock)
          .mockResolvedValueOnce({
            exists: () => true,
            val: () => ({extra1: {memberNr: 'extra', lastname: 'Extra'}}),
          })
          .mockResolvedValue({forEach: () => {}});

        await importCsv(csv, options);

        // Both CSV entry (1001) and additional entry (extra1) should be pushed
        expect(push).toHaveBeenCalledTimes(2);
      });

      it('does not merge when additional entries snapshot does not exist', async () => {
        const options = {
          path: '/users',
          additionalEntriesPath: '/settings/extra',
          columns: [
            { csv: 'UserName', firebase: 'memberNr', isKey: true },
            { csv: 'LastName', firebase: 'lastname' },
          ],
        };

        const csv = 'UserName,LastName\n1001,Smith\n';

        // First get call: additionalEntriesPath snapshot (does not exist)
        // Second get call: updateExisting snapshot (empty)
        (get as jest.Mock)
          .mockResolvedValueOnce({exists: () => false, val: () => null})
          .mockResolvedValue({forEach: () => {}});

        await importCsv(csv, options);

        // Only the CSV entry should be pushed
        expect(push).toHaveBeenCalledTimes(1);
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
        expect(push).toHaveBeenCalled();
      });
    });
  });
});
