'use strict';

// Same as the client's toOrderKey (src/modules/movements/pagination.ts): the
// createdBy-prefixed index key that owner-scoped list queries order by.
const ORDER_KEY_BASE = 9999999999999;

function toOrderKey(createdBy, negativeTimestamp) {
  return `${createdBy}_${ORDER_KEY_BASE - negativeTimestamp * -1}`;
}

module.exports = { toOrderKey };
