import Config from 'Config';
import Firebase from 'firebase';
import Download from './Download.js';
import { firebaseToLocal, compareAscending } from './movements.js';
import dates from '../core/dates.js';
import MovementsArray from './MovementsArray.js';
import moment from 'moment';

class MovementReport {

  constructor(startDate, endDate) {
    this.startDate = startDate;
    this.endDate = endDate;

    this.creationDate = moment();
  }

  generate(callback) {
    const types = [
      { key: 'D', path: '/departures' },
      { key: 'A', path: '/arrivals' },
    ];
    const promises = types.map(this.readMovements, this);
    Promise.all(promises)
      .then((snapshots) => {
        this.build(snapshots, callback);
      });
  }

  readMovements(type) {
    return new Promise(fulfill => {
      new Firebase(Config.firebaseUrl + type.path)
        .orderByChild('dateTime')
        .startAt(dates.isoStartOfDay(this.startDate))
        .endAt(dates.isoEndOfDay(this.endDate))
        .once('value', (snapshot) => {
          fulfill({
            type,
            snapshot,
          });
        }, this);
    });
  }

  build(snapshots, callback) {
    const content = 'data:text/csv;charset=utf-8,' + this.buildContent(snapshots);
    const filename = 'report_' + this.startDate + '_' + this.endDate + '.csv';
    const download = new Download(filename, 'text/csv;charset=utf-8;', content);
    callback(download);
  }

  buildContent(snapshots) {
    const movements = this.getMovementsArray(snapshots);

    const csvRecords = movements
      .filter(movement => !(movement.type === 'D' && movement.departureRoute === 'circuits'))
      .map(this.getMovementString, this);

    csvRecords.unshift(MovementReport.header.join(','));

    return csvRecords.join('\n');
  }

  getMovementsArray(snapshots) {
    const movements = new MovementsArray([], compareAscending);

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

  getMovementString(movement) {
    const airstatRecord = {
      ARP: 'LSZT',
      TYPMO: this.getMovementType(movement),
      ACREG: movement.immatriculation,
      TYPTR: this.getTypeOfTraffic(movement),
      NUMMO: this.getNumberOfMovements(movement),
      ORIDE: movement.location,
      PAX: movement.passengerCount || 0,
      DATMO: movement.date.replace(/-/g, ''),
      TIMMO: movement.time.replace(/:/g, ''),
      PIMO: movement.runway,
      TYPPI: 'G',
      DIRDE: this.getDirectionOfDeparture(movement),
      CID: 'LSZT',
      CDT: this.creationDate.format('YYYYMMDD'),
      CDM: this.creationDate.format('HHmm'),
    };

    return MovementReport.header
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
    return (movement.type === 'D') ? 1 : movement.landingCount || 1;
  }

  getDirectionOfDeparture(movement) {
    return (movement.type === 'D') ? movement.departureRoute : '';
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

export default MovementReport;
