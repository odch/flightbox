jest.mock('../../../util/firebase');
jest.mock('firebase/database', () => ({
  push: jest.fn(),
  update: jest.fn(),
}));

import firebase from '../../../util/firebase';
import {push, update as fbUpdate} from 'firebase/database';
import {create, update} from './remote';

describe('modules', () => {
  describe('ui/arrivalPayment/remote', () => {
    let mockRef;

    beforeEach(() => {
      mockRef = {};
      jest.clearAllMocks();
      (firebase as jest.Mock).mockReturnValue(mockRef);
    });

    describe('create', () => {
      it('pushes payment and returns new ref', async () => {
        const newRef = {key: 'pay123'};
        (push as jest.Mock).mockResolvedValue(newRef);
        const result = await create({amount: 50});
        expect(firebase).toHaveBeenCalledWith('/card-payments');
        expect(push).toHaveBeenCalledWith(mockRef, {amount: 50});
        expect(result).toBe(newRef);
      });
    });

    describe('update', () => {
      it('updates payment by id', async () => {
        (fbUpdate as jest.Mock).mockResolvedValue(undefined);
        await update('pay123', {status: 'paid'});
        expect(firebase).toHaveBeenCalledWith('/card-payments/pay123');
        expect(fbUpdate).toHaveBeenCalledWith(mockRef, {status: 'paid'});
      });
    });
  });
});
