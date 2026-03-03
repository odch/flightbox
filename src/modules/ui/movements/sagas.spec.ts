import * as sagas from './sagas';
import {history} from '../../../history';

jest.mock('../../../history', () => ({
  history: {
    push: jest.fn(),
    goBack: jest.fn(),
  },
}));

describe('modules', () => {
  describe('ui', () => {
    describe('movements', () => {
      describe('sagas', () => {
        beforeEach(() => {
          (history.push as jest.Mock).mockClear();
          (history.goBack as jest.Mock).mockClear();
        });

        describe('showMovementWizard', () => {
          it('should push the movement wizard route and complete', () => {
            const action = {
              payload: {movementType: 'departure', key: 'dep-key-1'}
            };
            const generator = sagas.showMovementWizard(action);

            expect(generator.next().done).toEqual(true);
            expect(history.push).toHaveBeenCalledWith('/departure/dep-key-1');
          });
        });

        describe('createMovementFromMovement', () => {
          it('should push arrival route when source is departure', () => {
            const action = {
              payload: {sourceMovementType: 'departure', sourceMovementKey: 'dep-key-1'}
            };
            const generator = sagas.createMovementFromMovement(action);

            expect(generator.next().done).toEqual(true);
            expect(history.push).toHaveBeenCalledWith('/arrival/new/dep-key-1');
          });

          it('should push departure route when source is arrival', () => {
            const action = {
              payload: {sourceMovementType: 'arrival', sourceMovementKey: 'arr-key-1'}
            };
            const generator = sagas.createMovementFromMovement(action);

            expect(generator.next().done).toEqual(true);
            expect(history.push).toHaveBeenCalledWith('/departure/new/arr-key-1');
          });
        });

        describe('cancelWizard', () => {
          it('should call history.goBack and complete', () => {
            const generator = sagas.cancelWizard();

            expect(generator.next().done).toEqual(true);
            expect(history.goBack).toHaveBeenCalled();
          });
        });
      });
    });
  });
});
