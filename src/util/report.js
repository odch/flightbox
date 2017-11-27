import MovementReport from './MovementReport';
import LandingsReport from './LandingsReport';
import YearlySummaryReport from './YearlySummaryReport';

export function airstat(year, month, options) {
  return new Promise(resolve => {
    new MovementReport(year, month, options)
      .generate(download => {
        resolve(download);
      });
  });
}

export function landings(year, month) {
  return new Promise(resolve => {
    new LandingsReport(year, month)
      .generate(download => {
        resolve(download);
      });
  });
}

export function yearlySummary(year) {
  return new Promise(resolve => {
    new YearlySummaryReport(year)
      .generate(download => {
        resolve(download);
      });
  });
}
