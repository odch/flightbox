import MovementReport from './MovementReport';
import LandingsReport from './LandingsReport';

export function airstat(startDate, endDate, options) {
  return new Promise(resolve => {
    new MovementReport(startDate, endDate, options)
      .generate(download => {
        resolve(download);
      });
  });
}

export function landings(startDate, endDate) {
  return new Promise(resolve => {
    new LandingsReport(startDate, endDate)
      .generate(download => {
        resolve(download);
      });
  });
}
