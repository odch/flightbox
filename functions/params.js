'use strict';

const { defineString } = require('firebase-functions/params');

exports.RTDB_URL = defineString('RTDB_URL', { default: '' });
exports.RTDB_INSTANCE = defineString('RTDB_INSTANCE');
