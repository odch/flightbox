import firebase from './firebase.js';
import Download from './Download.js';
import { firebaseToLocal, compareAscending } from './movements.js';
import { fetch as fetchAircrafts } from './aircrafts';
import { fetch as fetchAerodromes } from './aerodromes';
import { getFromItemKey } from './reference-number';
import dates from './dates';
import ItemsArray from './ItemsArray';
import {getAirstatType} from './flightTypes';
import moment from 'moment';
import writeCsv from './writeCsv';

class MovementReport {

  constructor(year, month, options = {}) {
    month = month < 10 ? '0' + month : month;
    const day = '01';

    this.startDate = year + '-' + month + '-' + day;
    this.endDate = moment(this.startDate).endOf('month').format('YYYY-MM-DD');

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
    this.buildContent(snapshots, aircrafts, aerodromes).then(content => {
      if (this.options.download === false) {
        callback(content)
      } else {
        const downloadContent = 'data:text/csv;charset=utf-8,' + content;
        const filename = this.getFileName();
        const download = new Download(filename, 'text/csv;charset=utf-8;', downloadContent);
        callback(download);
      }
    });
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

    const records = movements
      .filter(movement => !(movement.type === 'D' && movement.departureRoute === 'circuits'))
      .map(movement => this.getMovementRecord(movement, aircrafts, aerodromes), this);

    const header = (this.options.internal === true)
      ? MovementReport.header.concat(MovementReport.internalHeader)
      : MovementReport.header;
    records.unshift(header);

    return writeCsv(records);
  }

  getMovementsArray(snapshots) {
    const movements = new ItemsArray([], compareAscending);

    snapshots.forEach(snapshot => {
      snapshot.snapshot.forEach(record => {
        const movement = firebaseToLocal(record.val());
        movement.key = record.key;
        movement.type = snapshot.type.key;

        if (movement.type === 'A'
          && movement.arrivalRoute !== 'circuits'
          && (movement.landingCount > 1 || movement.goAroundCount > 0)) {
          const circuitMovement = Object.assign({}, movement);

          circuitMovement.key += '_circuits'
          circuitMovement.arrivalRoute = 'circuits'
          circuitMovement.location = __CONF__.aerodrome.ICAO

          movement.landingCount = movement.landingCount > 1 ? 1 : 0
          movement.goAroundCount = movement.landingCount === 1 ? 0 : 1

          circuitMovement.landingCount -= movement.landingCount
          circuitMovement.goAroundCount -= movement.goAroundCount

          movements.insert(circuitMovement)
        }

        movements.insert(movement);
      });
    });

    return movements.array;
  }

  getMovementRecord(movement, aircrafts, aerodromes) {
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

    return headerRow.map(header => airstatRecord[header]);
  }

  getMovementType(movement) {
    return (movement.type === 'A' && movement.arrivalRoute === 'circuits') ? 'V' : movement.type;
  }

  getTypeOfTraffic(movement) {
    return getAirstatType(movement.flightType);
  }

  getNumberOfMovements(movement) {
    if (movement.type === 'A' && movement.arrivalRoute === 'circuits') {
      const landingCount = movement.landingCount || 1;
      const goAroundCount = movement.goAroundCount || 0;

      const landingAndGoAroundSum = landingCount + goAroundCount;

      return landingAndGoAroundSum * 2
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
