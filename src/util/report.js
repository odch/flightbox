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

export function landings(year, month, options) {
  return new Promise(resolve => {
    new LandingsReport(year, month, options)
      .generate(download => {
        resolve(download);
      });
  });
}

export function yearlySummary(year, options) {
  return new Promise(resolve => {
    new YearlySummaryReport(year, options)
      .generate(download => {
        resolve(download);
      });
  });
}
