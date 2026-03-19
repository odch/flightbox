import moment from 'moment';

export function getMidnightDelayMs(): number {
  return moment().endOf('day').diff(moment(), 'milliseconds');
}
