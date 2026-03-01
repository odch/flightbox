jest.mock('../../../util/firebase');

import firebase from '../../../util/firebase';
import {create, update} from './remote';

describe('modules', () => {
  describe('ui/arrivalPayment/remote', () => {
    let mockRef;

    beforeEach(() => {
      mockRef = {
        push: jest.fn(),
        update: jest.fn().mockResolvedValue(),
      };
      firebase.mockReturnValue(mockRef);
    });

    describe('create', () => {
      it('pushes payment and returns new ref', async () => {
        const newRef = {key: 'pay123'};
        mockRef.push.mockResolvedValue(newRef);
        const result = await create({amount: 50});
        expect(mockRef.push).toHaveBeenCalledWith({amount: 50});
        expect(result).toBe(newRef);
      });
    });

    describe('update', () => {
      it('updates payment by id', async () => {
        await update('pay123', {status: 'paid'});
        expect(firebase).toHaveBeenCalledWith('/card-payments/pay123');
        expect(mockRef.update).toHaveBeenCalledWith({status: 'paid'});
      });
    });
  });
});
