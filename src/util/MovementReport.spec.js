// MovementReport reads __CONF__ at module load time. Use jest.resetModules() + require()
// so that global.__CONF__ is set before any module executes.

describe('util', () => {
  describe('MovementReport', () => {
    let MovementReport;
    let firebase;
    let fetchAircrafts;
    let fetchAerodromes;

    let mockAircrafts;
    let mockAerodromes;

    beforeEach(() => {
      global.__CONF__ = {
        aerodrome: {
          ICAO: 'LSZT',
          runways: {
            0: {name: '10', type: 'A'},
            1: {name: '28', type: 'A'},
          },
        },
        enabledFlightTypes: {0: 'private', 1: 'instruction'},
        memberManagement: false,
      };

      jest.resetModules();
      jest.mock('./firebase');
      jest.mock('./aircrafts');
      jest.mock('./aerodromes');

      firebase = require('./firebase').default;
      fetchAircrafts = require('./aircrafts').fetch;
      fetchAerodromes = require('./aerodromes').fetch;
      MovementReport = require('./MovementReport').default;

      mockAircrafts = {club: {}, homeBase: {}};
      fetchAircrafts.mockResolvedValue(mockAircrafts);

      mockAerodromes = {
        LSZT: {name: 'Thun'},
        LSZB: {name: 'Bern'},
      };
      fetchAerodromes.mockResolvedValue(mockAerodromes);
    });

    // Helper: build a snapshot record from a local movement object.
    // firebaseToLocal() converts dateTime (UTC ISO) -> local date/time.
    function makeRecord(movement, key) {
      const dateTime = new Date(`${movement.date}T${movement.time}:00`).toISOString();
      return {
        key: key || 'key-abc1',
        val: () => ({
          dateTime,
          immatriculation: movement.immatriculation || 'HB-KOF',
          mtow: movement.mtow || 750,
          flightType: movement.flightType || 'private',
          aircraftCategory: movement.aircraftCategory || 'Flugzeug',
          passengerCount: movement.passengerCount || 0,
          landingCount: movement.landingCount,
          goAroundCount: movement.goAroundCount,
          arrivalRoute: movement.arrivalRoute,
          departureRoute: movement.departureRoute,
          runway: movement.runway,
          location: movement.location,
          landingFeeTotal: movement.landingFeeTotal,
          goAroundFeeTotal: movement.goAroundFeeTotal,
          remarks: movement.remarks,
          memberNr: movement.memberNr,
          email: movement.email,
          lastname: movement.lastname,
          paymentMethod: movement.paymentMethod,
        }),
      };
    }

    function makeSnapshot(records) {
      return {forEach: (fn) => records.forEach(fn)};
    }

    describe('constructor', () => {
      it('pads single-digit month', () => {
        const report = new MovementReport(2023, 3);
        expect(report.startDate).toBe('2023-03-01');
      });

      it('handles two-digit month', () => {
        const report = new MovementReport(2023, 11);
        expect(report.startDate).toBe('2023-11-01');
      });

      it('computes endDate as last day of month', () => {
        const report = new MovementReport(2023, 2);
        expect(report.endDate).toBe('2023-02-28');
      });

      it('stores options', () => {
        const report = new MovementReport(2023, 1, {internal: true});
        expect(report.options.internal).toBe(true);
      });
    });

    describe('getFileName', () => {
      it('returns CSV filename based on ICAO and month', () => {
        const report = new MovementReport(2023, 6);
        expect(report.getFileName()).toBe('ARP_LSZT_062023.csv');
      });

      it('appends _internal when options.internal is true', () => {
        const report = new MovementReport(2023, 6, {internal: true});
        expect(report.getFileName()).toBe('ARP_LSZT_062023_internal.csv');
      });
    });

    describe('getMovementType', () => {
      it('returns V for arrival circuits', () => {
        const report = new MovementReport(2023, 6);
        expect(report.getMovementType({type: 'A', arrivalRoute: 'circuits'})).toBe('V');
      });

      it('returns A for regular arrival', () => {
        const report = new MovementReport(2023, 6);
        expect(report.getMovementType({type: 'A', arrivalRoute: 'IFR'})).toBe('A');
      });

      it('returns D for departure', () => {
        const report = new MovementReport(2023, 6);
        expect(report.getMovementType({type: 'D', departureRoute: 'VFR'})).toBe('D');
      });
    });

    describe('getNumberOfMovements', () => {
      it('returns 1 for non-circuit movements', () => {
        const report = new MovementReport(2023, 6);
        expect(report.getNumberOfMovements({type: 'A', arrivalRoute: 'IFR'})).toBe(1);
      });

      it('returns double the sum of landings and go-arounds for circuits', () => {
        const report = new MovementReport(2023, 6);
        const movement = {type: 'A', arrivalRoute: 'circuits', landingCount: 3, goAroundCount: 1};
        expect(report.getNumberOfMovements(movement)).toBe(8); // (3+1)*2
      });

      it('defaults landingCount to 1 and goAroundCount to 0 when absent', () => {
        const report = new MovementReport(2023, 6);
        expect(report.getNumberOfMovements({type: 'A', arrivalRoute: 'circuits'})).toBe(2);
      });

      it('returns 1 for departure movement', () => {
        const report = new MovementReport(2023, 6);
        expect(report.getNumberOfMovements({type: 'D'})).toBe(1);
      });
    });

    describe('getLocation', () => {
      it('returns uppercase ICAO when found in aerodromes', () => {
        const report = new MovementReport(2023, 6);
        expect(report.getLocation('lszt', mockAerodromes)).toBe('LSZT');
      });

      it('returns LOCATION_DEFAULT when location not found', () => {
        const report = new MovementReport(2023, 6);
        expect(report.getLocation('XXXX', mockAerodromes)).toBe(MovementReport.LOCATION_DEFAULT);
      });

      it('returns LOCATION_DEFAULT when location is null', () => {
        const report = new MovementReport(2023, 6);
        expect(report.getLocation(null, mockAerodromes)).toBe(MovementReport.LOCATION_DEFAULT);
      });

      it('returns LOCATION_DEFAULT when location is a number', () => {
        const report = new MovementReport(2023, 6);
        expect(report.getLocation(123, mockAerodromes)).toBe(MovementReport.LOCATION_DEFAULT);
      });

      it('returns LOCATION_DEFAULT when location is undefined', () => {
        const report = new MovementReport(2023, 6);
        expect(report.getLocation(undefined, mockAerodromes)).toBe(MovementReport.LOCATION_DEFAULT);
      });
    });

    describe('getDirectionOfDeparture', () => {
      it('returns departureRoute for departures', () => {
        const report = new MovementReport(2023, 6);
        expect(report.getDirectionOfDeparture({type: 'D', departureRoute: 'VFR'})).toBe('VFR');
      });

      it('returns arrivalRoute for non-circuit arrivals', () => {
        const report = new MovementReport(2023, 6);
        expect(report.getDirectionOfDeparture({type: 'A', arrivalRoute: 'IFR'})).toBe('IFR');
      });

      it('returns empty string for circuit arrivals (falls through to default)', () => {
        const report = new MovementReport(2023, 6);
        expect(report.getDirectionOfDeparture({type: 'A', arrivalRoute: 'circuits'})).toBe('');
      });
    });

    describe('getRunway', () => {
      it('returns the runway when set', () => {
        const report = new MovementReport(2023, 6);
        expect(report.getRunway({runway: '10', immatriculation: 'HB-KOF', aircraftCategory: 'Flugzeug'})).toBe('10');
      });

      it('returns 0 for helicopter without runway', () => {
        const report = new MovementReport(2023, 6);
        expect(report.getRunway({runway: undefined, immatriculation: 'HB-XFF', aircraftCategory: 'Hubschrauber'})).toBe('0');
      });

      it('returns empty string for fixed-wing without runway', () => {
        const report = new MovementReport(2023, 6);
        expect(report.getRunway({runway: undefined, immatriculation: 'HB-KOF', aircraftCategory: 'Flugzeug'})).toBe('');
      });

      it('returns 0 for helicopter registration HBX without aircraftCategory', () => {
        const report = new MovementReport(2023, 6);
        expect(report.getRunway({runway: undefined, immatriculation: 'HBX123'})).toBe('0');
      });
    });

    describe('getTypeOfRunway', () => {
      it('returns runway type when found in config', () => {
        const report = new MovementReport(2023, 6);
        expect(report.getTypeOfRunway({runway: '10'})).toBe('A');
      });

      it('returns empty string when runway not found in config', () => {
        const report = new MovementReport(2023, 6);
        expect(report.getTypeOfRunway({runway: '99'})).toBe('');
      });
    });

    describe('getMovementKey', () => {
      it('returns last 4 alphanumeric chars of key uppercased', () => {
        const report = new MovementReport(2023, 6);
        expect(report.getMovementKey({key: 'key-abc1'})).toBe('ABC1');
      });

      it('appends CIRCUITS suffix for circuit movement keys', () => {
        const report = new MovementReport(2023, 6);
        const result = report.getMovementKey({key: 'key-abc1_circuits'});
        expect(result).toContain('_CIRCUITS');
      });
    });

    describe('addInternalFields', () => {
      it('adds lastname, email, mtow fields', () => {
        const report = new MovementReport(2023, 6);
        const record = {ORIDE: 'LSZT'};
        const movement = {
          key: 'key-abc1',
          lastname: 'Smith',
          email: 'test@test.com',
          mtow: 750,
          landingCount: 0,
          goAroundCount: 0,
          immatriculation: 'HB-KOF',
        };
        report.addInternalFields(record, movement, mockAircrafts);
        expect(record.LASTNAME).toBe('Smith');
        expect(record.EMAIL).toBe('test@test.com');
        expect(record.MTOW).toBe(750);
      });

      it('sums landing and go-around fees into FEES', () => {
        const report = new MovementReport(2023, 6);
        const record = {ORIDE: 'LSZT'};
        const movement = {
          key: 'key-abc1',
          lastname: 'Smith',
          email: 'a@b.com',
          mtow: 750,
          landingFeeTotal: 20,
          goAroundFeeTotal: 5,
          landingCount: 2,
          goAroundCount: 1,
          immatriculation: 'HB-KOF',
        };
        report.addInternalFields(record, movement, mockAircrafts);
        expect(record.FEES).toBe(25);
      });

      it('sets FEES to 0 when fees are absent', () => {
        const report = new MovementReport(2023, 6);
        const record = {ORIDE: 'LSZT'};
        const movement = {
          key: 'key-abc1',
          lastname: 'Smith',
          email: 'a@b.com',
          mtow: 750,
          landingCount: 0,
          goAroundCount: 0,
          immatriculation: 'HB-KOF',
        };
        report.addInternalFields(record, movement, mockAircrafts);
        expect(record.FEES).toBe(0);
      });

      it('sets ORIGINAL_ORIDE when ORIDE is the default location', () => {
        const report = new MovementReport(2023, 6);
        const record = {ORIDE: MovementReport.LOCATION_DEFAULT};
        const movement = {
          key: 'key-abc1',
          lastname: 'Smith',
          email: 'a@b.com',
          mtow: 750,
          landingCount: 0,
          goAroundCount: 0,
          location: 'unknown',
          immatriculation: 'HB-KOF',
        };
        report.addInternalFields(record, movement, mockAircrafts);
        expect(record.ORIGINAL_ORIDE).toBe('unknown');
      });

      it('leaves ORIGINAL_ORIDE undefined when ORIDE is not default', () => {
        const report = new MovementReport(2023, 6);
        const record = {ORIDE: 'LSZT'};
        const movement = {
          key: 'key-abc1',
          lastname: 'Smith',
          email: 'a@b.com',
          mtow: 750,
          landingCount: 0,
          goAroundCount: 0,
          location: 'LSZT',
          immatriculation: 'HB-KOF',
        };
        report.addInternalFields(record, movement, mockAircrafts);
        expect(record.ORIGINAL_ORIDE).toBeUndefined();
      });

      it('sets CLUB to 1 when aircraft is a club aircraft', () => {
        const report = new MovementReport(2023, 6);
        const record = {ORIDE: 'LSZT'};
        const movement = {
          key: 'key-abc1', lastname: 'Smith', email: 'a@b.com', mtow: 750,
          landingCount: 0, goAroundCount: 0, immatriculation: 'HB-KOF',
        };
        const aircrafts = {club: {'HB-KOF': true}, homeBase: {}};
        report.addInternalFields(record, movement, aircrafts);
        expect(record.CLUB).toBe(1);
      });

      it('sets HOME_BASE to 1 when aircraft is home base', () => {
        const report = new MovementReport(2023, 6);
        const record = {ORIDE: 'LSZT'};
        const movement = {
          key: 'key-abc1', lastname: 'Smith', email: 'a@b.com', mtow: 750,
          landingCount: 0, goAroundCount: 0, immatriculation: 'HB-KOF',
        };
        const aircrafts = {club: {}, homeBase: {'HB-KOF': true}};
        report.addInternalFields(record, movement, aircrafts);
        expect(record.HOME_BASE).toBe(1);
      });

      it('sets payment method fields when paymentMethod is present', () => {
        const report = new MovementReport(2023, 6);
        const record = {ORIDE: 'LSZT'};
        const movement = {
          key: 'key-abc1', lastname: 'Smith', email: 'a@b.com', mtow: 750,
          landingCount: 0, goAroundCount: 0, immatriculation: 'HB-KOF',
          paymentMethod: {method: 'invoice', invoiceRecipientName: 'Recipient Co'},
        };
        report.addInternalFields(record, movement, mockAircrafts);
        expect(record.PAYMENT_METHOD).toBe('invoice');
        expect(record.INVOICE_RECIPIENT).toBe('Recipient Co');
      });

      it('sets payment method fields to undefined when paymentMethod is absent', () => {
        const report = new MovementReport(2023, 6);
        const record = {ORIDE: 'LSZT'};
        const movement = {
          key: 'key-abc1', lastname: 'Smith', email: 'a@b.com', mtow: 750,
          landingCount: 0, goAroundCount: 0, immatriculation: 'HB-KOF',
        };
        report.addInternalFields(record, movement, mockAircrafts);
        expect(record.PAYMENT_METHOD).toBeUndefined();
        expect(record.INVOICE_RECIPIENT).toBeUndefined();
      });
    });

    describe('getMovementsArray', () => {
      it('splits arrival with multiple landings into arrival + circuits movement', () => {
        const report = new MovementReport(2023, 6);

        const arrival = makeRecord({
          date: '2023-06-01', time: '10:00', immatriculation: 'HB-KOF',
          flightType: 'private', aircraftCategory: 'Flugzeug',
          arrivalRoute: 'IFR', landingCount: 3, goAroundCount: 0,
        }, 'key-abc1');

        const snapshots = [
          {type: {key: 'A'}, snapshot: makeSnapshot([arrival])},
          {type: {key: 'D'}, snapshot: makeSnapshot([])},
        ];

        const movements = report.getMovementsArray(snapshots);
        expect(movements).toHaveLength(2);
        const circuits = movements.find(m => m.arrivalRoute === 'circuits');
        expect(circuits).toBeDefined();
        expect(circuits.landingCount).toBe(2);
        expect(circuits.location).toBe('LSZT');
        expect(circuits.landingFeeTotal).toBe(0);
        expect(circuits.goAroundFeeTotal).toBe(0);
      });

      it('splits arrival with go-around into arrival + circuits', () => {
        const report = new MovementReport(2023, 6);

        const arrival = makeRecord({
          date: '2023-06-01', time: '10:00', immatriculation: 'HB-KOF',
          flightType: 'private', aircraftCategory: 'Flugzeug',
          arrivalRoute: 'IFR', landingCount: 1, goAroundCount: 1,
        }, 'key-abc1');

        const snapshots = [
          {type: {key: 'A'}, snapshot: makeSnapshot([arrival])},
          {type: {key: 'D'}, snapshot: makeSnapshot([])},
        ];

        const movements = report.getMovementsArray(snapshots);
        expect(movements).toHaveLength(2);
        const circuits = movements.find(m => m.arrivalRoute === 'circuits');
        // landingCount=1, goAroundCount=1: movement.landingCount becomes 0,
        // movement.goAroundCount becomes 1; circuitMovement gets 1-0=1 landings, 1-1=0 go-arounds
        expect(circuits.landingCount).toBe(1);
        expect(circuits.goAroundCount).toBe(0);
      });

      it('does not split arrivals with exactly 1 landing and 0 go-arounds', () => {
        const report = new MovementReport(2023, 6);

        const arrival = makeRecord({
          date: '2023-06-01', time: '10:00', immatriculation: 'HB-KOF',
          flightType: 'private', aircraftCategory: 'Flugzeug',
          arrivalRoute: 'IFR', landingCount: 1, goAroundCount: 0,
        }, 'key-abc1');

        const snapshots = [
          {type: {key: 'A'}, snapshot: makeSnapshot([arrival])},
          {type: {key: 'D'}, snapshot: makeSnapshot([])},
        ];

        const movements = report.getMovementsArray(snapshots);
        expect(movements).toHaveLength(1);
      });

      it('does not split arrivals that are already circuits', () => {
        const report = new MovementReport(2023, 6);

        const arrival = makeRecord({
          date: '2023-06-01', time: '10:00', immatriculation: 'HB-KOF',
          flightType: 'private', aircraftCategory: 'Flugzeug',
          arrivalRoute: 'circuits', landingCount: 3, goAroundCount: 0,
        }, 'key-abc1');

        const snapshots = [
          {type: {key: 'A'}, snapshot: makeSnapshot([arrival])},
          {type: {key: 'D'}, snapshot: makeSnapshot([])},
        ];

        const movements = report.getMovementsArray(snapshots);
        expect(movements).toHaveLength(1);
      });

      it('adds departure movements without modification', () => {
        const report = new MovementReport(2023, 6);

        const departure = makeRecord({
          date: '2023-06-01', time: '10:00', immatriculation: 'HB-KOF',
          flightType: 'private', aircraftCategory: 'Flugzeug',
          departureRoute: 'VFR', location: 'LSZT',
        }, 'key-dep1');

        const snapshots = [
          {type: {key: 'D'}, snapshot: makeSnapshot([departure])},
          {type: {key: 'A'}, snapshot: makeSnapshot([])},
        ];

        const movements = report.getMovementsArray(snapshots);
        expect(movements).toHaveLength(1);
        expect(movements[0].type).toBe('D');
      });
    });

    describe('buildContent', () => {
      it('returns CSV string with standard header row', async () => {
        const report = new MovementReport(2023, 6);
        const snapshots = [
          {type: {key: 'D'}, snapshot: makeSnapshot([])},
          {type: {key: 'A'}, snapshot: makeSnapshot([])},
        ];
        const content = await report.buildContent(snapshots, mockAircrafts, mockAerodromes);
        expect(content).toContain('ARP');
        expect(content).toContain('TYPMO');
        expect(content).toContain('ACREG');
      });

      it('includes internal header fields when options.internal is true', async () => {
        const report = new MovementReport(2023, 6, {internal: true});

        const departure = makeRecord({
          date: '2023-06-01', time: '10:00', immatriculation: 'HB-KOF',
          flightType: 'private', aircraftCategory: 'Flugzeug',
          departureRoute: 'VFR', location: 'LSZT',
        }, 'key-dep1');

        const snapshots = [
          {type: {key: 'D'}, snapshot: makeSnapshot([departure])},
          {type: {key: 'A'}, snapshot: makeSnapshot([])},
        ];
        const content = await report.buildContent(snapshots, mockAircrafts, mockAerodromes);
        expect(content).toContain('KEY');
        expect(content).toContain('LASTNAME');
      });

      it('uses semicolon delimiter when specified', async () => {
        const report = new MovementReport(2023, 6, {delimiter: ';'});
        const snapshots = [
          {type: {key: 'D'}, snapshot: makeSnapshot([])},
          {type: {key: 'A'}, snapshot: makeSnapshot([])},
        ];
        const content = await report.buildContent(snapshots, mockAircrafts, mockAerodromes);
        expect(content).toContain(';');
      });

      it('filters out departure circuit movements', async () => {
        const report = new MovementReport(2023, 6);

        const departure = makeRecord({
          date: '2023-06-01', time: '10:00', immatriculation: 'HB-KOF',
          flightType: 'private', aircraftCategory: 'Flugzeug',
          departureRoute: 'circuits', location: 'LSZT',
        }, 'key-dep1');

        const snapshots = [
          {type: {key: 'D'}, snapshot: makeSnapshot([departure])},
          {type: {key: 'A'}, snapshot: makeSnapshot([])},
        ];
        const content = await report.buildContent(snapshots, mockAircrafts, mockAerodromes);
        const lines = content.trim().split('\n');
        // Only header row, circuit departures filtered out
        expect(lines).toHaveLength(1);
      });

      it('produces correct data row for a private departure', async () => {
        const report = new MovementReport(2023, 6);

        const departure = makeRecord({
          date: '2023-06-01', time: '10:00', immatriculation: 'HB-KOF',
          flightType: 'private', aircraftCategory: 'Flugzeug',
          departureRoute: 'VFR', location: 'LSZB',
          runway: '10',
        }, 'key-dep1');

        const snapshots = [
          {type: {key: 'D'}, snapshot: makeSnapshot([departure])},
          {type: {key: 'A'}, snapshot: makeSnapshot([])},
        ];
        const content = await report.buildContent(snapshots, mockAircrafts, mockAerodromes);
        expect(content).toContain('HB-KOF');
        expect(content).toContain('LSZT'); // ARP field
        expect(content).toContain('LSZB'); // ORIDE field
      });
    });

    describe('build', () => {
      it('calls callback with download object by default', () => {
        const report = new MovementReport(2023, 6);

        const snapshots = [
          {type: {key: 'D'}, snapshot: makeSnapshot([])},
          {type: {key: 'A'}, snapshot: makeSnapshot([])},
        ];

        return new Promise(resolve => {
          report.build(snapshots, mockAircrafts, mockAerodromes, (arg) => {
            expect(arg.filename).toContain('.csv');
            expect(arg.content).toContain('data:text/csv');
            resolve();
          });
        });
      });

      it('calls callback with raw string content when download=false', () => {
        const report = new MovementReport(2023, 6, {download: false});

        const snapshots = [
          {type: {key: 'D'}, snapshot: makeSnapshot([])},
          {type: {key: 'A'}, snapshot: makeSnapshot([])},
        ];

        return new Promise(resolve => {
          report.build(snapshots, mockAircrafts, mockAerodromes, (arg) => {
            // Raw content is a string, not a Download object
            expect(typeof arg).toBe('string');
            resolve();
          });
        });
      });
    });

    describe('static properties', () => {
      it('LOCATION_DEFAULT is LSZZ', () => {
        expect(MovementReport.LOCATION_DEFAULT).toBe('LSZZ');
      });

      it('header contains expected columns', () => {
        expect(MovementReport.header).toContain('ARP');
        expect(MovementReport.header).toContain('TYPMO');
        expect(MovementReport.header).toContain('ACREG');
        expect(MovementReport.header).toContain('DATMO');
        expect(MovementReport.header).toContain('TIMMO');
      });

      it('internalHeader contains KEY and other internal columns', () => {
        expect(MovementReport.internalHeader).toContain('KEY');
        expect(MovementReport.internalHeader).toContain('LASTNAME');
        expect(MovementReport.internalHeader).toContain('EMAIL');
        expect(MovementReport.internalHeader).toContain('FEES');
        expect(MovementReport.internalHeader).toContain('LDG_COUNT');
      });

      it('internalHeader does not contain MEMBERNR when memberManagement is false', () => {
        expect(MovementReport.internalHeader).not.toContain('MEMBERNR');
      });
    });

    describe('addInternalFields with memberManagement=true', () => {
      it('includes MEMBERNR in record when memberManagement is true', () => {
        // Re-load module with memberManagement=true
        global.__CONF__ = {
          aerodrome: {
            ICAO: 'LSZT',
            runways: {
              0: {name: '10', type: 'A'},
              1: {name: '28', type: 'A'},
            },
          },
          enabledFlightTypes: {0: 'private', 1: 'instruction'},
          memberManagement: true,
        };
        jest.resetModules();
        jest.mock('./firebase');
        jest.mock('./aircrafts');
        jest.mock('./aerodromes');
        const MR = require('./MovementReport').default;

        const report = new MR(2023, 6, {internal: true});
        const airstatRecord = {ORIDE: 'LSZT'};
        const movement = {
          key: 'key-abc1', lastname: 'Smith', email: 'a@b.com', mtow: 750,
          landingCount: 0, goAroundCount: 0, immatriculation: 'HB-KOF',
          memberNr: '12345',
        };
        report.addInternalFields(airstatRecord, movement, {club: {}, homeBase: {}});
        expect(airstatRecord.MEMBERNR).toBe('12345');
      });
    });

    describe('readMovements', () => {
      it('resolves with type and snapshot after firebase query', () => {
        const mockRef = {
          orderByChild: jest.fn().mockReturnThis(),
          startAt: jest.fn().mockReturnThis(),
          endAt: jest.fn().mockReturnThis(),
          once: jest.fn((event, callback) => {
            callback({forEach: () => {}});
          }),
        };
        firebase.mockImplementation((path, callback) => callback(null, mockRef));

        const report = new MovementReport(2023, 6);
        const type = {key: 'D', path: '/departures'};

        return report.readMovements(type).then(result => {
          expect(result.type).toBe(type);
          expect(result.snapshot).toBeDefined();
        });
      });
    });

    describe('generate', () => {
      it('calls callback with a Download after fetching all data', () => {
        const mockRef = {
          orderByChild: jest.fn().mockReturnThis(),
          startAt: jest.fn().mockReturnThis(),
          endAt: jest.fn().mockReturnThis(),
          once: jest.fn((event, callback) => {
            callback({forEach: () => {}});
          }),
        };
        firebase.mockImplementation((path, callback) => callback(null, mockRef));

        const report = new MovementReport(2023, 6);

        return new Promise(resolve => {
          report.generate((download) => {
            expect(download.filename).toContain('.csv');
            resolve();
          });
        });
      });
    });
  });
});
