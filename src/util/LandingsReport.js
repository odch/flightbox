import firebase from './firebase.js';
import Download from './Download.js';
import { firebaseToLocal } from './movements.js';
import dates from '../util/dates';
import moment from 'moment';

class LandingsReport {

  constructor(startDate, endDate) {
    this.startDate = startDate;
    this.endDate = endDate;

    this.creationDate = moment();
  }

  generate(callback) {
    const mfgtAircrafts = this.readAircrafts('/settings/aircraftsMFGT');
    const lsztAircrafts = this.readAircrafts('/settings/aircraftsLSZT');
    const arrivals = this.readArrivals();

    Promise.all([mfgtAircrafts, lsztAircrafts, arrivals])
      .then(results => {
        const aircrafts = {
          mfgt: results[0],
          lszt: results[1],
        };
        this.build(results[2], aircrafts, callback);
      });
  }

  readAircrafts(path) {
    return new Promise(resolve => {
      firebase(path, (error, ref) => {
        ref.once('value', snapshot => {
          const aircrafts = {};
          snapshot.forEach(record => {
            aircrafts[record.key()] = true;
          });
          resolve(aircrafts);
        });
      });
    });
  }

  readArrivals() {
    return new Promise(resolve => {
      firebase('/arrivals', (error, ref) => {
        ref.orderByChild('dateTime')
          .startAt(dates.isoStartOfDay(this.startDate))
          .endAt(dates.isoEndOfDay(this.endDate))
          .once('value', resolve, this);
      });
    });
  }

  build(arrivals, aircrafts, callback) {
    const content = 'data:text/csv;charset=utf-8,' + this.buildContent(arrivals, aircrafts);
    const filename = 'landings_' + this.startDate + '_' + this.endDate + '.csv';
    const download = new Download(filename, 'text/csv;charset=utf-8;', content);
    callback(download);
  }

  buildContent(arrivals, aircrafts) {
    const summary = this.getAircraftsSummary(arrivals);
    const csvRecords = summary.map(record => this.getRecordString(record, aircrafts), this);
    csvRecords.unshift(LandingsReport.header.join(','));
    return csvRecords.join('\n');
  }

  getAircraftsSummary(arrivals) {
    const map = {};

    arrivals.forEach(record => {
      const arrival = firebaseToLocal(record.val());
      const { immatriculation, mtow, landingCount } = arrival;

      if (!map[immatriculation]) {
        map[immatriculation] = {
          immatriculation,
          mtow,
          landingCount: 0,
          invalidMtow: false,
        };
      }

      if (typeof landingCount === 'number') {
        map[immatriculation].landingCount += landingCount;
      }

      if (mtow !== map[immatriculation].mtow) {
        map[immatriculation].invalidMtow = true;
      }
    });

    const arr = [];
    Object.keys(map).forEach(key => {
      arr.push(map[key]);
    });
    arr.sort((a1, a2) => a1.immatriculation.localeCompare(a2.immatriculation));

    return arr;
  }

  getRecordString(record, aircrafts) {
    const csvRecord = {
      Registration: record.immatriculation,
      MTOW: record.mtow,
      Landings: record.landingCount,
      MFGT: aircrafts.mfgt[record.immatriculation] === true ? 1 : undefined,
      LSZT: aircrafts.lszt[record.immatriculation] === true ? 1 : undefined,
      InvalidMTOW: record.invalidMtow === true ? 1 : undefined,
    };

    return LandingsReport.header
      .map(header => csvRecord[header])
      .join(',');
  }
}

LandingsReport.header = [
  'Registration',
  'MTOW',
  'Landings',
  'MFGT',
  'LSZT',
  'InvalidMTOW',
];

export default LandingsReport;
