import firebase from './firebase.js';
import Download from './Download.js';
import { firebaseToLocal } from './movements.js';
import { fetch as fetchAircrafts } from './aircrafts';
import dates from '../util/dates';
import moment from 'moment';

class LandingsReport {

  constructor(startDate, endDate) {
    this.startDate = startDate;
    this.endDate = endDate;

    this.creationDate = moment();
  }

  generate(callback) {
    const arrivals = this.readArrivals();
    const aircrafts = fetchAircrafts();

    Promise.all([arrivals, aircrafts])
      .then(results => {
        this.build(results[0], results[1], callback);
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
      Club: aircrafts.club[record.immatriculation] === true ? 1 : undefined,
      HomeBase: aircrafts.homeBase[record.immatriculation] === true ? 1 : undefined,
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
  'Club',
  'Homebase',
  'InvalidMTOW',
];

export default LandingsReport;
