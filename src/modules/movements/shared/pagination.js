import { localToFirebase } from '../../../util/movements';

export const LIMIT = 10;

export function getPagination(items) {
  let start = undefined;
  let limit = LIMIT;

  let i = items.length;
  while (i > 0) {
    const negTs = localToFirebase(items[i - 1]).negativeTimestamp;
    if (start === undefined) {
      start = negTs;
      limit++;
    } else if (start === negTs) {
      limit++;
    } else {
      break;
    }
    i--;
  }

  return {
    start,
    limit,
  };
}
