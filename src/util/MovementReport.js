import firebase from './firebase.js';
import Download from './Download.js';
import { firebaseToLocal, compareAscending } from './movements.js';
import { fetch as fetchAircrafts } from './aircrafts';
import { fetch as fetchAerodromes } from './aerodromes';
import { getFromItemKey } from './reference-number';
import dates from '../util/dates';
import ItemsArray from './ItemsArray';
import moment from 'moment';

class MovementReport {

  constructor(startDate, endDate, options = {}) {
    this.startDate = startDate;
    this.endDate = endDate;
    this.options = options;

    this.creationDate = moment();
  }

  generate(callback) {
    const types = [
      { key: 'D', path: '/departures' },
      { key: 'A', path: '/arrivals' },
    ];
    const promises = types.map(this.readMovements, this);
    const aircrafts = fetchAircrafts();
    const aerodromes = fetchAerodromes();
    Promise.all(promises.concat([aircrafts, aerodromes]))
      .then((results) => {
        const snapshots = [results[0], results[1]];
        const aircrafts = results[2];
        const aerodromes = results[3];
        this.build(snapshots, aircrafts, aerodromes, callback);
      });
  }

  readMovements(type) {
    return new Promise(fulfill => {
      firebase(type.path, (error, ref) => {
        ref.orderByChild('dateTime')
          .startAt(dates.isoStartOfDay(this.startDate))
          .endAt(dates.isoEndOfDay(this.endDate))
          .once('value', (snapshot) => {
            fulfill({
              type,
              snapshot,
            });
          }, this);
      });
    });
  }

  build(snapshots, aircrafts, aerodromes, callback) {
    const content = 'data:text/csv;charset=utf-8,' + this.buildContent(snapshots, aircrafts, aerodromes);
    const filename = this.getFileName();
    const download = new Download(filename, 'text/csv;charset=utf-8;', content);
    callback(download);
  }

  getFileName() {
    let fileName = 'ARP_' + __CONF__.aerodrome.ICAO + '_' + moment(this.startDate).format('MMYYYY');
    if (this.options.internal === true) {
      fileName += '_internal';
    }
    fileName += '.csv';
    return fileName;
  }

  buildContent(snapshots, aircrafts, aerodromes) {
    const movements = this.getMovementsArray(snapshots);

    const csvRecords = movements
      .filter(movement => !(movement.type === 'D' && movement.departureRoute === 'circuits'))
      .map(movement => this.getMovementString(movement, aircrafts, aerodromes), this);

    const header = (this.options.internal === true)
      ? MovementReport.header.concat(MovementReport.internalHeader)
      : MovementReport.header;
    csvRecords.unshift(header.join(','));

    return csvRecords.join('\n');
  }

  getMovementsArray(snapshots) {
    const movements = new ItemsArray([], compareAscending);

    snapshots.forEach(snapshot => {
      snapshot.snapshot.forEach(record => {
        const movement = firebaseToLocal(record.val());
        movement.key = record.key();
        movement.type = snapshot.type.key;

        movements.insert(movement);
      });
    });

    return movements.array;
  }

  getMovementString(movement, aircrafts, aerodromes) {
    const airstatRecord = {
      ARP: __CONF__.aerodrome.ICAO,
      TYPMO: this.getMovementType(movement),
      ACREG: movement.immatriculation,
      TYPTR: this.getTypeOfTraffic(movement),
      NUMMO: this.getNumberOfMovements(movement),
      ORIDE: this.getLocation(movement.location, aerodromes),
      PAX: movement.passengerCount || 0,
      DATMO: movement.date.replace(/-/g, ''),
      TIMMO: movement.time.replace(/:/g, ''),
      PIMO: movement.runway,
      TYPPI: 'G',
      DIRDE: this.getDirectionOfDeparture(movement),
      CID: __CONF__.aerodrome.ICAO,
      CDT: this.creationDate.format('YYYYMMDD'),
      CDM: this.creationDate.format('HHmm'),
    };

    let headerRow = MovementReport.header;

    if (this.options.internal === true) {
      this.addInternalFields(airstatRecord, movement, aircrafts);
      headerRow = headerRow.concat(MovementReport.internalHeader);
    }

    return headerRow
      .map(header => airstatRecord[header])
      .join(',');
  }

  getMovementType(movement) {
    return (movement.type === 'A' && movement.arrivalRoute === 'circuits') ? 'V' : movement.type;
  }

  getTypeOfTraffic(movement) {
    const types = {
      'private': 42,
      'instruction': 43,
      'commercial': 32,
    };
    return types[movement.flightType];
  }

  getNumberOfMovements(movement) {
    if (movement.type === 'A') {
      const landingCount = movement.landingCount || 1;

      return (movement.arrivalRoute === 'circuits')
        ? landingCount * 2
        : landingCount * 2 - 1;
    }

    return 1;
  }

  getLocation(location, aerodromes) {
    if (location && typeof location === 'string') {
      const upper = location.toUpperCase();
      const result = aerodromes[upper];
      if (result) {
        return upper;
      }
    }
    return MovementReport.LOCATION_DEFAULT;
  }

  getDirectionOfDeparture(movement) {
    return (movement.type === 'D') ? movement.departureRoute : '';
  }

  addInternalFields(airstatRecord, movement, aircrafts) {
    airstatRecord.KEY = getFromItemKey(movement.key);
    airstatRecord.MEMBERNR = movement.memberNr;
    airstatRecord.LASTNAME = movement.lastname;
    airstatRecord.MTOW = movement.mtow;
    airstatRecord.CLUB = aircrafts.club[movement.immatriculation] === true ? 1 : undefined;
    airstatRecord.HOME_BASE = aircrafts.homeBase[movement.immatriculation] === true ? 1 : undefined;
    airstatRecord.ORIGINAL_ORIDE = airstatRecord.ORIDE === MovementReport.LOCATION_DEFAULT
      ? movement.location
      : undefined;
    airstatRecord.REMARKS = movement.remarks;

    return airstatRecord;
  }
}

MovementReport.header = [
  'ARP',
  'TYPMO',
  'ACREG',
  'TYPTR',
  'NUMMO',
  'ORIDE',
  'PAX',
  'DATMO',
  'TIMMO',
  'PIMO',
  'TYPPI',
  'DIRDE',
  'CID',
  'CDT',
  'CDM',
];

MovementReport.internalHeader = [
  'KEY',
  'MEMBERNR',
  'LASTNAME',
  'MTOW',
  'CLUB',
  'HOME_BASE',
  'ORIGINAL_ORIDE',
  'REMARKS',
];

MovementReport.LOCATION_DEFAULT = 'LSZZ';

export default MovementReport;
