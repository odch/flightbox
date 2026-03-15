import {TYPE_LABELS, ACTION_LABELS} from './labels';

describe('components', () => {
  describe('MovementList', () => {
    describe('labels', () => {
      describe('TYPE_LABELS', () => {
        it('departure has a label string', () => {
          expect(typeof TYPE_LABELS.departure.label).toBe('string');
          expect(TYPE_LABELS.departure.label.length).toBeGreaterThan(0);
        });

        it('departure has correct icon', () => {
          expect(TYPE_LABELS.departure.icon).toBe('flight_takeoff');
        });

        it('arrival has a label string', () => {
          expect(typeof TYPE_LABELS.arrival.label).toBe('string');
          expect(TYPE_LABELS.arrival.label.length).toBeGreaterThan(0);
        });

        it('arrival has correct icon', () => {
          expect(TYPE_LABELS.arrival.icon).toBe('flight_land');
        });

        it('departure and arrival have different labels', () => {
          expect(TYPE_LABELS.departure.label).not.toBe(TYPE_LABELS.arrival.label);
        });
      });

      describe('ACTION_LABELS', () => {
        it('departure has a label string', () => {
          expect(typeof ACTION_LABELS.departure.label).toBe('string');
          expect(ACTION_LABELS.departure.label.length).toBeGreaterThan(0);
        });

        it('departure action has flight_land icon (create arrival)', () => {
          expect(ACTION_LABELS.departure.icon).toBe('flight_land');
        });

        it('arrival has a label string', () => {
          expect(typeof ACTION_LABELS.arrival.label).toBe('string');
          expect(ACTION_LABELS.arrival.label.length).toBeGreaterThan(0);
        });

        it('arrival action has flight_takeoff icon (create departure)', () => {
          expect(ACTION_LABELS.arrival.icon).toBe('flight_takeoff');
        });

        it('departure and arrival action labels are different', () => {
          expect(ACTION_LABELS.departure.label).not.toBe(ACTION_LABELS.arrival.label);
        });
      });
    });
  });
});
