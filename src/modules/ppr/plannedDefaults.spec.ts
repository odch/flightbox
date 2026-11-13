import { getDefaultPlannedDateTime } from './plannedDefaults';

describe('modules', () => {
  describe('ppr', () => {
    describe('getDefaultPlannedDateTime', () => {
      it('starts two hours ahead, rounded up to the quarter hour (Zurich time)', () => {
        // 14:20 in Zurich (CET)
        expect(getDefaultPlannedDateTime(Date.UTC(2026, 10, 13, 13, 20))).toEqual({
          plannedDate: '2026-11-13',
          plannedTime: '16:30',
        });
      });

      it('keeps a time that is already on the quarter hour', () => {
        expect(getDefaultPlannedDateTime(Date.UTC(2026, 10, 13, 13, 15))).toEqual({
          plannedDate: '2026-11-13',
          plannedTime: '16:15',
        });
      });

      it('ignores seconds', () => {
        expect(getDefaultPlannedDateTime(Date.UTC(2026, 10, 13, 13, 15, 30))).toEqual({
          plannedDate: '2026-11-13',
          plannedTime: '16:15',
        });
      });

      it('uses summer time in summer', () => {
        // 12:05 in Zurich (CEST)
        expect(getDefaultPlannedDateTime(Date.UTC(2027, 6, 1, 10, 5))).toEqual({
          plannedDate: '2027-07-01',
          plannedTime: '14:15',
        });
      });

      it('rolls over to the next day late in the evening', () => {
        // 23:20 in Zurich
        expect(getDefaultPlannedDateTime(Date.UTC(2026, 10, 13, 22, 20))).toEqual({
          plannedDate: '2026-11-14',
          plannedTime: '01:30',
        });
      });

      it('handles the switch to summer time', () => {
        // 01:20 CET on 28 March 2027; two hours later it is 04:20 CEST
        expect(getDefaultPlannedDateTime(Date.UTC(2027, 2, 28, 0, 20))).toEqual({
          plannedDate: '2027-03-28',
          plannedTime: '04:30',
        });
      });
    });
  });
});
