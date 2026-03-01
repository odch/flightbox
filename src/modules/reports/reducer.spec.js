import reducer from './reducer';
import * as actions from './actions';

describe('modules', () => {
  describe('reports', () => {
    describe('reducer', () => {
      it('should handle initial state', () => {
        expect(
          reducer(undefined, {})
        ).toEqual({});
      });

      describe('INIT_REPORT', () => {
        it('should initialize a report entry with last month date and empty parameters', () => {
          const mockDate = {
            year: jest.fn(() => 2026),
            month: jest.fn(() => 1),
          };
          const mockMoment = jest.fn(() => ({
            subtract: jest.fn(() => mockDate),
          }));

          jest.mock('moment', () => mockMoment);

          const result = reducer({}, actions.initReport('monthly'));

          expect(result).toHaveProperty('monthly');
          expect(result.monthly).toHaveProperty('date');
          expect(result.monthly).toHaveProperty('parameters');
          expect(result.monthly.parameters).toEqual({});
          expect(result.monthly.done).toBeUndefined();
        });

        it('should add a new report without affecting existing ones', () => {
          const existingState = {
            monthly: {
              date: { year: 2026, month: 1 },
              parameters: { aerodrome: 'lszt' },
            },
          };
          const result = reducer(existingState, actions.initReport('yearly'));

          expect(result).toHaveProperty('monthly');
          expect(result.monthly).toEqual(existingState.monthly);
          expect(result).toHaveProperty('yearly');
        });
      });

      describe('SET_REPORT_DATE', () => {
        it('should set the date for the given report', () => {
          const date = { year: 2025, month: 12 };
          expect(
            reducer({
              monthly: {
                date: { year: 2026, month: 1 },
                parameters: {},
              },
            }, actions.setReportDate('monthly', date))
          ).toEqual({
            monthly: {
              date,
              parameters: {},
            },
          });
        });
      });

      describe('SET_REPORT_PARAMETER', () => {
        it('should set a parameter for the given report', () => {
          expect(
            reducer({
              monthly: {
                date: { year: 2026, month: 1 },
                parameters: {},
              },
            }, actions.setReportParameter('monthly', 'aerodrome', 'lszt'))
          ).toEqual({
            monthly: {
              date: { year: 2026, month: 1 },
              parameters: {
                aerodrome: 'lszt',
              },
            },
          });
        });

        it('should add a parameter without affecting existing parameters', () => {
          expect(
            reducer({
              monthly: {
                date: { year: 2026, month: 1 },
                parameters: {
                  aerodrome: 'lszt',
                },
              },
            }, actions.setReportParameter('monthly', 'format', 'pdf'))
          ).toEqual({
            monthly: {
              date: { year: 2026, month: 1 },
              parameters: {
                aerodrome: 'lszt',
                format: 'pdf',
              },
            },
          });
        });

        it('should override an existing parameter', () => {
          expect(
            reducer({
              monthly: {
                date: { year: 2026, month: 1 },
                parameters: {
                  aerodrome: 'lszt',
                },
              },
            }, actions.setReportParameter('monthly', 'aerodrome', 'lspv'))
          ).toEqual({
            monthly: {
              date: { year: 2026, month: 1 },
              parameters: {
                aerodrome: 'lspv',
              },
            },
          });
        });
      });

      describe('SET_REPORT_GENERATION_IN_PROGRESS', () => {
        it('should set generationInProgress to true', () => {
          expect(
            reducer({
              monthly: {
                date: { year: 2026, month: 1 },
                parameters: {},
              },
            }, actions.setReportGenerationInProgress('monthly', true))
          ).toEqual({
            monthly: {
              date: { year: 2026, month: 1 },
              parameters: {},
              generationInProgress: true,
            },
          });
        });

        it('should set generationInProgress to false', () => {
          expect(
            reducer({
              monthly: {
                date: { year: 2026, month: 1 },
                parameters: {},
                generationInProgress: true,
              },
            }, actions.setReportGenerationInProgress('monthly', false))
          ).toEqual({
            monthly: {
              date: { year: 2026, month: 1 },
              parameters: {},
              generationInProgress: false,
            },
          });
        });
      });
    });
  });
});
