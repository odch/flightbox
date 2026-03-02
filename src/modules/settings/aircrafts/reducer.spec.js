import reducer from './reducer';
import * as actions from './actions';

const INITIAL_STATE = {};

describe('modules', () => {
  describe('settings', () => {
    describe('aircrafts', () => {
      describe('reducer', () => {
        it('should handle initial state', () => {
          expect(
            reducer(undefined, {})
          ).toEqual(INITIAL_STATE);
        });

        describe('LOAD_AIRCRAFT_SETTINGS_SUCCESS', () => {
          it('should store aircrafts under the given type key', () => {
            const aircrafts = ['HB-KOF', 'HB-PBY'];
            expect(
              reducer({}, actions.loadAircraftSettingsSuccess('airplanes', aircrafts))
            ).toEqual({
              airplanes: aircrafts,
            });
          });

          it('should add a new type without affecting existing ones', () => {
            const airplanes = ['HB-KOF'];
            const gliders = ['HB-PBY'];
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
            const oldAircrafts = ['HB-OLD'];
            const newAircrafts = ['HB-KOF', 'HB-NEW'];
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
