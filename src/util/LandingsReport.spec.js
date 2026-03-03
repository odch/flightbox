// LandingsReport imports firebase and movements; set __CONF__ before loading modules.
// Globals must be set via jest.resetModules() + require() because ES imports are hoisted.

describe('util', () => {
  describe('LandingsReport', () => {
    let LandingsReport;
    let firebase;
    let get;

    beforeEach(() => {
      global.__CONF__ = {
        aerodrome: {
          ICAO: 'LSZT',
          runways: [
            {name: '10', type: 'A'},
            {name: '28', type: 'A'},
          ],
        },
        enabledFlightTypes: {0: 'private', 1: 'instruction'},
        memberManagement: false,
      };

      jest.resetModules();
      jest.mock('./firebase');
      jest.mock('./aircrafts');
      jest.mock('firebase/database', () => ({
        get: jest.fn(),
        query: jest.fn(),
        orderByChild: jest.fn(),
        startAt: jest.fn(),
        endAt: jest.fn(),
      }));

      firebase = require('./firebase').default;
      ({get} = require('firebase/database'));
      LandingsReport = require('./LandingsReport').default;
    });

    // Helper: build a fake Firebase snapshot with an array of plain movement objects.
    // Each object has local date+time; we convert to UTC dateTime for firebaseToLocal.
    function makeArrivalsSnapshot(movementObjects) {
      return {
        forEach: (fn) => {
          movementObjects.forEach((mov, i) => {
            const dateTime = new Date(`${mov.date}T${mov.time}:00`).toISOString();
            fn({
              key: `key-${i}`,
              val: () => ({
                dateTime,
                immatriculation: mov.immatriculation,
                mtow: mov.mtow,
                landingCount: mov.landingCount,
              }),
            });
          });
        },
      };
    }

    function makeMockRef() {
      return {
        orderByChild: jest.fn().mockReturnThis(),
        startAt: jest.fn().mockReturnThis(),
        endAt: jest.fn().mockReturnThis(),
        once: jest.fn(),
      };
    }

    describe('constructor', () => {
      it('pads single-digit month with leading zero', () => {
        const report = new LandingsReport(2023, 3);
        expect(report.startDate).toBe('2023-03-01');
      });

      it('does not double-pad two-digit month', () => {
        const report = new LandingsReport(2023, 11);
        expect(report.startDate).toBe('2023-11-01');
      });

      it('computes endDate as last day of month', () => {
        const report = new LandingsReport(2023, 2);
        expect(report.endDate).toBe('2023-02-28');
      });

      it('uses comma as default delimiter', () => {
        const report = new LandingsReport(2023, 1);
        expect(report.delimiter).toBe(',');
      });

      it('uses custom delimiter when provided', () => {
        const report = new LandingsReport(2023, 1, {delimiter: ';'});
        expect(report.delimiter).toBe(';');
      });
    });

    describe('getAircraftsSummary', () => {
      it('aggregates landings by immatriculation', () => {
        const report = new LandingsReport(2023, 6);

        const arrivals = makeArrivalsSnapshot([
          {date: '2023-06-01', time: '10:00', immatriculation: 'HB-KOF', mtow: 750, landingCount: 2},
          {date: '2023-06-02', time: '11:00', immatriculation: 'HB-KOF', mtow: 750, landingCount: 3},
        ]);

        const summary = report.getAircraftsSummary(arrivals);
        expect(summary).toHaveLength(1);
        expect(summary[0].immatriculation).toBe('HB-KOF');
        expect(summary[0].landingCount).toBe(5);
      });

      it('marks invalidMtow when mtow differs across records', () => {
        const report = new LandingsReport(2023, 6);

        const arrivals = makeArrivalsSnapshot([
          {date: '2023-06-01', time: '10:00', immatriculation: 'HB-KOF', mtow: 750, landingCount: 1},
          {date: '2023-06-02', time: '11:00', immatriculation: 'HB-KOF', mtow: 800, landingCount: 1},
        ]);

        const summary = report.getAircraftsSummary(arrivals);
        expect(summary[0].invalidMtow).toBe(true);
      });

      it('does not mark invalidMtow when mtow is consistent', () => {
        const report = new LandingsReport(2023, 6);

        const arrivals = makeArrivalsSnapshot([
          {date: '2023-06-01', time: '10:00', immatriculation: 'HB-KOF', mtow: 750, landingCount: 1},
          {date: '2023-06-02', time: '11:00', immatriculation: 'HB-KOF', mtow: 750, landingCount: 1},
        ]);

        const summary = report.getAircraftsSummary(arrivals);
        expect(summary[0].invalidMtow).toBe(false);
      });

      it('handles missing landingCount (non-number) gracefully', () => {
        const report = new LandingsReport(2023, 6);

        const snapshot = {
          forEach: (fn) => {
            fn({
              key: 'k1',
              val: () => ({
                dateTime: '2023-06-01T08:00:00.000Z',
                immatriculation: 'HB-KOF',
                mtow: 750,
                // landingCount omitted
              }),
            });
          },
        };

        const summary = report.getAircraftsSummary(snapshot);
        expect(summary[0].landingCount).toBe(0);
      });

      it('sorts results alphabetically by immatriculation', () => {
        const report = new LandingsReport(2023, 6);

        const arrivals = makeArrivalsSnapshot([
          {date: '2023-06-01', time: '10:00', immatriculation: 'HB-ZZZ', mtow: 750, landingCount: 1},
          {date: '2023-06-01', time: '11:00', immatriculation: 'HB-AAA', mtow: 750, landingCount: 1},
        ]);

        const summary = report.getAircraftsSummary(arrivals);
        expect(summary[0].immatriculation).toBe('HB-AAA');
        expect(summary[1].immatriculation).toBe('HB-ZZZ');
      });

      it('handles empty arrivals snapshot', () => {
        const report = new LandingsReport(2023, 6);
        const arrivals = {forEach: () => {}};
        const summary = report.getAircraftsSummary(arrivals);
        expect(summary).toHaveLength(0);
      });

      it('tracks multiple distinct aircraft', () => {
        const report = new LandingsReport(2023, 6);
        const arrivals = makeArrivalsSnapshot([
          {date: '2023-06-01', time: '10:00', immatriculation: 'HB-AAA', mtow: 600, landingCount: 1},
          {date: '2023-06-01', time: '11:00', immatriculation: 'HB-BBB', mtow: 750, landingCount: 2},
        ]);
        const summary = report.getAircraftsSummary(arrivals);
        expect(summary).toHaveLength(2);
      });
    });

    describe('getRecordString', () => {
      it('builds CSV row with all fields', () => {
        const report = new LandingsReport(2023, 6);
        const aircrafts = {
          club: {'HB-KOF': true},
          homeBase: {'HB-KOF': true},
        };
        const record = {immatriculation: 'HB-KOF', mtow: 750, landingCount: 5, invalidMtow: false};

        const row = report.getRecordString(record, aircrafts);
        expect(row).toContain('HB-KOF');
        expect(row).toContain('750');
        expect(row).toContain('5');
      });

      it('sets Club to 1 when in club list', () => {
        const report = new LandingsReport(2023, 6);
        const aircrafts = {club: {'HB-KOF': true}, homeBase: {}};
        const record = {immatriculation: 'HB-KOF', mtow: 750, landingCount: 1, invalidMtow: false};

        const row = report.getRecordString(record, aircrafts);
        const parts = row.split(',');
        expect(parts[3]).toBe('1'); // Club
      });

      it('sets Club undefined when not in club list', () => {
        const report = new LandingsReport(2023, 6);
        const aircrafts = {club: {}, homeBase: {}};
        const record = {immatriculation: 'HB-KOF', mtow: 750, landingCount: 1, invalidMtow: false};

        const row = report.getRecordString(record, aircrafts);
        const parts = row.split(',');
        expect(parts[3]).toBe(''); // Club undefined -> empty
        expect(parts[4]).toBe(''); // HomeBase undefined -> empty
      });

      it('HomeBase column is always empty due to key mismatch (Homebase vs HomeBase)', () => {
        // LandingsReport.header has 'Homebase' (lowercase b) but csvRecord uses 'HomeBase',
        // so csvRecord['Homebase'] is always undefined -> always empty in CSV output.
        const report = new LandingsReport(2023, 6);
        const aircrafts = {club: {}, homeBase: {'HB-KOF': true}};
        const record = {immatriculation: 'HB-KOF', mtow: 750, landingCount: 1, invalidMtow: false};

        const row = report.getRecordString(record, aircrafts);
        const parts = row.split(',');
        expect(parts[4]).toBe(''); // always empty due to case mismatch in source
      });

      it('sets InvalidMTOW to 1 when invalidMtow is true', () => {
        const report = new LandingsReport(2023, 6);
        const aircrafts = {club: {}, homeBase: {}};
        const record = {immatriculation: 'HB-KOF', mtow: 750, landingCount: 1, invalidMtow: true};

        const row = report.getRecordString(record, aircrafts);
        const parts = row.split(',');
        expect(parts[5]).toBe('1');
      });

      it('sets InvalidMTOW undefined when invalidMtow is false', () => {
        const report = new LandingsReport(2023, 6);
        const aircrafts = {club: {}, homeBase: {}};
        const record = {immatriculation: 'HB-KOF', mtow: 750, landingCount: 1, invalidMtow: false};

        const row = report.getRecordString(record, aircrafts);
        const parts = row.split(',');
        expect(parts[5]).toBe('');
      });

      it('uses custom delimiter', () => {
        const report = new LandingsReport(2023, 6, {delimiter: ';'});
        const aircrafts = {club: {}, homeBase: {}};
        const record = {immatriculation: 'HB-KOF', mtow: 750, landingCount: 1, invalidMtow: false};

        const row = report.getRecordString(record, aircrafts);
        expect(row).toContain(';');
      });
    });

    describe('buildContent', () => {
      it('produces CSV with header and data rows', () => {
        const report = new LandingsReport(2023, 6);
        const aircrafts = {club: {}, homeBase: {}};

        const arrivals = makeArrivalsSnapshot([
          {date: '2023-06-01', time: '10:00', immatriculation: 'HB-KOF', mtow: 750, landingCount: 2},
        ]);

        const content = report.buildContent(arrivals, aircrafts);
        expect(content).toContain('Registration');
        expect(content).toContain('MTOW');
        expect(content).toContain('HB-KOF');
      });

      it('produces only header row when no arrivals', () => {
        const report = new LandingsReport(2023, 6);
        const aircrafts = {club: {}, homeBase: {}};
        const arrivals = {forEach: () => {}};

        const content = report.buildContent(arrivals, aircrafts);
        const lines = content.split('\n');
        expect(lines).toHaveLength(1);
        expect(lines[0]).toContain('Registration');
      });
    });

    describe('build', () => {
      it('calls callback with a Download object containing CSV content', () => {
        const report = new LandingsReport(2023, 6);
        const arrivals = {forEach: () => {}};
        const aircrafts = {club: {}, homeBase: {}};

        const callback = jest.fn();
        report.build(arrivals, aircrafts, callback);

        expect(callback).toHaveBeenCalledTimes(1);
        const download = callback.mock.calls[0][0];
        expect(download.filename).toContain('landings_');
        expect(download.content).toContain('data:text/csv');
      });

      it('includes start and end dates in filename', () => {
        const report = new LandingsReport(2023, 6);
        const arrivals = {forEach: () => {}};
        const aircrafts = {club: {}, homeBase: {}};

        const callback = jest.fn();
        report.build(arrivals, aircrafts, callback);

        const download = callback.mock.calls[0][0];
        expect(download.filename).toContain('2023-06-01');
        expect(download.filename).toContain('2023-06-30');
      });
    });

    describe('static header', () => {
      it('contains the expected column names', () => {
        expect(LandingsReport.header).toEqual([
          'Registration',
          'MTOW',
          'Landings',
          'Club',
          'Homebase',
          'InvalidMTOW',
        ]);
      });
    });

    describe('readArrivals', () => {
      it('resolves with a firebase snapshot after querying by dateTime', () => {
        const mockSnapshot = {forEach: () => {}};
        get.mockResolvedValue(mockSnapshot);

        const report = new LandingsReport(2023, 6);
        return report.readArrivals().then(snapshot => {
          expect(snapshot).toBeDefined();
        });
      });
    });

    describe('generate', () => {
      it('calls callback with a Download after fetching arrivals and aircrafts', () => {
        const mockSnapshot = {forEach: () => {}};
        get.mockResolvedValue(mockSnapshot);

        const fetchAircraftsMock = require('./aircrafts').fetch;
        fetchAircraftsMock.mockResolvedValue({club: {}, homeBase: {}});

        const report = new LandingsReport(2023, 6);

        return new Promise(resolve => {
          report.generate((download) => {
            expect(download.filename).toContain('landings_');
            resolve();
          });
        });
      });
    });
  });
});
