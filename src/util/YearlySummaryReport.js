import Download from './Download.js';
import MovementReport from "./MovementReport";
import {getAirstatType} from './flightTypes';
import isHelicopter from "./isHelicopter"

class YearlySummaryReport {

  constructor(year) {
    this.year = year;
  }

  generate(callback) {
    this.readMovementData().then(data => this.build(data, callback));
  }

  readMovementData() {
    const months = [];
    for (let month = 1; month <= 12; month++) {
      months.push(new Promise(resolve => {
        new MovementReport(this.year, month, {
          download: false,
        }).generate(data => resolve(data));
      }));
    }
    return Promise.all(months);
  }

  build(movementData, callback) {
    const content = 'data:text/csv;charset=utf-8,' + this.buildContent(movementData);
    const filename = 'summary_' + this.year + '.csv';
    const download = new Download(filename, 'text/csv;charset=utf-8;', content);
    callback(download);
  }

  buildContent(months) {
    const csvRecords = months.map((movements, index) => this.getMonthSummary(index + 1, movements), this);
    csvRecords.unshift(YearlySummaryReport.header.join(','));
    return csvRecords.join('\n');
  }

  getMonthSummary(monthNr, movements) {
    const summary = {
      Month: monthNr,

      ['RWY' + __CONF__.aerodrome.runways[0].name]: 0,
      ['RWY' + __CONF__.aerodrome.runways[1].name]: 0,

      PrivatePax: 0,
      PrivateLocal: 0,
      PrivateAway: 0,
      PrivateCircuits: 0,

      InstructionPax: 0,
      InstructionLocal: 0,
      InstructionAway: 0,
      InstructionCircuits: 0,

      CommercialPax: 0,
      CommercialLocal: 0,

      Helicopter:  0,

      Total: 0,
      TotalCircuits: 0,
    };

    const lines = movements.split('\n');

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      const columns = line.split(',');

      const movTrafficType = columns[1];
      const movReg = columns[2];
      const movFlightType = parseInt(columns[3]);
      const movLocation = columns[5];
      const movPax = parseInt(columns[6]);
      const movRwy = columns[9];

      let movCount = parseInt(columns[4]);
      let circuitsCount = 0;

      if (movFlightType === getAirstatType('private')) {
        summary.PrivatePax += movPax;

        if (movTrafficType === 'V') {
          circuitsCount = movCount;
          movCount = 0;
          summary.PrivateCircuits += circuitsCount;
        } else {
          if (movCount > 1) {
            if (movTrafficType !== 'A') {
              throw "Unexpected traffic type: " + movTrafficType;
            }
            if (movCount % 2 !== 1) {
              throw "Unexpected mov count: " + movCount;
            }

            circuitsCount = movCount - 1;
            summary.PrivateCircuits += circuitsCount;
            movCount = 1;
          }

          if (movLocation === __CONF__.aerodrome.ICAO) {
            summary.PrivateLocal += movCount;
          } else {
            summary.PrivateAway += movCount;
          }
        }
      } else if (movFlightType === getAirstatType('instruction')) {
        summary.InstructionPax += movPax;

        if (movTrafficType === 'V') {
          summary.InstructionCircuits += movCount;
        } else {
          if (movCount > 1) {
            if (movTrafficType !== 'A') {
              throw "Unexpected traffic type: " + movTrafficType;
            }
            if (movCount % 2 !== 1) {
              throw "Unexpected mov count: " + movCount;
            }

            circuitsCount = movCount - 1;
            summary.InstructionCircuits += circuitsCount;
            movCount = 1;
          }

          if (movLocation === __CONF__.aerodrome.ICAO) {
            summary.InstructionLocal += movCount;
          } else {
            summary.InstructionAway += movCount;
          }
        }
      } else if (movFlightType === getAirstatType('commercial')) {
        summary.CommercialPax += movPax;

        if (movLocation === __CONF__.aerodrome.ICAO) {
          summary.CommercialLocal += movCount;
        } else {
          // commercial flight, but not local
        }
      } else {
        // other flight type
      }

      summary['RWY' + movRwy] += (movCount + circuitsCount);

      if (this.isHelicopter(movReg)) {
        summary.Helicopter += (movCount + circuitsCount)
      }
    }

    summary.Total = summary['RWY' + __CONF__.aerodrome.runways[0].name] +
      summary['RWY' + __CONF__.aerodrome.runways[1].name];
    summary.TotalCircuits = summary.PrivateCircuits + summary.InstructionCircuits;

    return YearlySummaryReport.header
      .map(header => summary[header])
      .join(',');
  }

  isHelicopter(registration) {
    return isHelicopter(registration);
  }
}

YearlySummaryReport.header = [
  'Month',

  'RWY' + __CONF__.aerodrome.runways[0].name,
  'RWY' + __CONF__.aerodrome.runways[1].name,

  'PrivatePax',
  'PrivateLocal',
  'PrivateAway',
  'PrivateCircuits',

  'InstructionPax',
  'InstructionLocal',
  'InstructionAway',
  'InstructionCircuits',

  'CommercialPax',
  'CommercialLocal',

  'Helicopter',

  'Total',
  'TotalCircuits',
];

export default YearlySummaryReport;
