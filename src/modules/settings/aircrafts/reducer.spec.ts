import reducer from './reducer';
import * as actions from './actions';

const INITIAL_STATE = {};

describe('modules', () => {
  describe('settings', () => {
    describe('aircrafts', () => {
      describe('reducer', () => {
        it('should handle initial state', () => {
          expect(
            reducer(undefined, {} as any)
          ).toEqual(INITIAL_STATE);
        });

        describe('LOAD_AIRCRAFT_SETTINGS_SUCCESS', () => {
          it('should store aircrafts under the given type key', () => {
            const aircrafts = ['HB-KOF', 'HB-PBY'] as any;
            expect(
              reducer({}, actions.loadAircraftSettingsSuccess('airplanes', aircrafts))
            ).toEqual({
              airplanes: aircrafts,
            });
          });

          it('should add a new type without affecting existing ones', () => {
            const airplanes = ['HB-KOF'] as any;
            const gliders = ['HB-PBY'] as any;
            expect(
              reducer({
                airplanes,
              }, actions.loadAircraftSettingsSuccess('gliders', gliders))
            ).toEqual({
              airplanes,
              gliders,
            });
          });

          it('should override existing data for the same type', () => {
            const oldAircrafts = ['HB-OLD'] as any;
            const newAircrafts = ['HB-KOF', 'HB-NEW'] as any;
            expect(
              reducer({
                airplanes: oldAircrafts,
              }, actions.loadAircraftSettingsSuccess('airplanes', newAircrafts))
            ).toEqual({
              airplanes: newAircrafts,
            });
          });
        });
      });
    });
  });
});
