import reducer from './reducer';
import * as actions from './actions';
import ImmutableItemsArray from '../../../util/ImmutableItemsArray';

const INITIAL_STATE = {
  data: {
    status: null,
    details: ''
  },
  latest: new ImmutableItemsArray(),
  selected: null,
  loading: false,
  saving: false
};

describe('modules', () => {
  describe('settings', () => {
    describe('aerodromeStatus', () => {
      describe('reducer', () => {
        it('should handle initial state', () => {
          expect(
            reducer(undefined, {})
          ).toEqual(INITIAL_STATE);
        });

        describe('AERODROME_STATUS_LOADING', () => {
          it('should set loading flag', () => {
            expect(
              reducer({
                saving: false,
                loading: false
              }, actions.aerodromeStatusLoading())
            ).toEqual({
              saving: false,
              loading: true
            });
          });
        });

        describe('AERODROME_STATUS_LOADED', () => {
          it('should set loaded data', () => {
            const data = {
              status: 'restricted',
              details: 'Eine Landung pro Pilot pro Tag.'
            };
            const latest = new ImmutableItemsArray([{
              status: 'restricted',
              details: 'Eine Landung pro Pilot pro Tag.',
              timestamp: new Date('2020-03-29T13:45:00.000Z').getTime(),
              by: 'Hans Meier'
            }]);

            expect(
              reducer({
                  data: {
                    status: null,
                    details: ''
                  },
                  latest: new ImmutableItemsArray(),
                  selected: 'selected-key',
                  loading: true
                }, actions.aerodromeStatusLoaded(data, latest)
              )
            ).toEqual({
              data,
              latest,
              loading: false,
              selected: null
            });
          });
        });

        describe('UPDATE_AERODROME_STATUS', () => {
          it('should update the status data', () => {
            expect(
              reducer({
                  data: {
                    status: 'open',
                    details: ''
                  },
                }, actions.updateAerodromeStatus('restricted', 'Eine Landung pro Pilot pro Tag.')
              )
            ).toEqual({
              data: {
                status: 'restricted',
                details: 'Eine Landung pro Pilot pro Tag.'
              }
            });
          });
        });

        describe('SET_AERODROME_STATUS_SAVING', () => {
          it('should set the saving flag', () => {
            expect(
              reducer({
                  data: {
                    status: 'open',
                    details: ''
                  },
                  saving: false
                }, actions.setAerodromeStatusSaving()
              )
            ).toEqual({
              data: {
                status: 'open',
                details: ''
              },
              saving: true
            });
          });
        });

        describe('SAVE_AERODROME_STATUS_SUCCESS', () => {
          it('should reset the saving flag', () => {
            expect(
              reducer({
                  data: {
                    status: 'open',
                    details: ''
                  },
                  saving: true
                }, actions.saveAerodromeStatusSuccess()
              )
            ).toEqual({
              data: {
                status: 'open',
                details: ''
              },
              saving: false
            });
          });
        });

        describe('SELECT_STATUS', () => {
          it('should set selected status', () => {
            expect(
              reducer({
                selected: 'status1',
              }, actions.selectAerodromeStatus('status2'))
            ).toEqual({
              selected: 'status2'
            });
          });

          it('should unset selected status', () => {
            expect(
              reducer({
                selected: 'status1'
              }, actions.selectAerodromeStatus(null))
            ).toEqual({
              selected: null
            });
          });
        });

        describe('SET_CURRENT_AERODROME_STATUS', () => {
          it('should update the current status', () => {
            expect(
              reducer({
                current: {
                  status: 'closed',
                  details: '',
                  by: 'Hans Meier',
                  timestamp: new Date('2020-03-29T13:45:00.000Z').getTime()
                },
              }, actions.setCurrentAerodromeStatus({
                status: 'open',
                details: 'Willkommen!',
                by: 'Kurt Keller',
                timestamp: new Date('2020-04-12T12:18:00.000Z').getTime()
              }))
            ).toEqual({
              current: {
                status: 'open',
                details: 'Willkommen!',
                by: 'Kurt Keller',
                timestamp: new Date('2020-04-12T12:18:00.000Z').getTime()
              }
            });
          });
        });
      });
    });
  });
});

