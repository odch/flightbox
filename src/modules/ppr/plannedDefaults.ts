import moment from 'moment-timezone';

// A new request starts about two hours ahead, which leaves the aerodrome
// time to approve it, rounded up to the quarter hour like the times in the
// movement wizards
const LEAD_TIME_MINUTES = 120;
const ROUNDING_MINUTES = 15;

// The aerodrome's (Zurich) date and time a new request starts with. Late in
// the evening it rolls over to the next day, so it is never in the past.
export function getDefaultPlannedDateTime(now: number = Date.now()): { plannedDate: string; plannedTime: string } {
  const planned = moment.tz(now, 'Europe/Zurich')
    .seconds(0)
    .milliseconds(0)
    .add(LEAD_TIME_MINUTES, 'minutes');

  const remainder = planned.minutes() % ROUNDING_MINUTES;
  if (remainder !== 0) {
    planned.add(ROUNDING_MINUTES - remainder, 'minutes');
  }

  return {
    plannedDate: planned.format('YYYY-MM-DD'),
    plannedTime: planned.format('HH:mm'),
  };
}
