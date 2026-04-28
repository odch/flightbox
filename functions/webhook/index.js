const { onValueCreated } = require('firebase-functions/v2/database');
const { defineString } = require('firebase-functions/params');
const { logger } = require('firebase-functions/v2');
const admin = require('firebase-admin');
const request = require('request-promise');

const RTDB_INSTANCE = defineString('RTDB_INSTANCE');
const WEBHOOK_REGION = defineString('WEBHOOK_REGION', { default: 'europe-west1' });

module.exports = onValueCreated(
  {
    region: `{{ params.${WEBHOOK_REGION.name} }}`,
    instance: `{{ params.${RTDB_INSTANCE.name} }}`,
    ref: 'status/{statusId}',
  },
  async (event) => {
    const snap = event.data;
    const r = await admin.database().ref('settings/webhookUrl').once('value');
    const webhook_url = r.val();
    if (webhook_url == null || webhook_url === '') {
      logger.log('Webhook disabled', snap.ref);
      return;
    }
    logger.log('Webhook started', snap.ref, webhook_url);
    const message = { text: snap.val().details };
    const response = await request({
      uri: webhook_url,
      method: 'POST',
      json: true,
      body: message,
      resolveWithFullResponse: true,
    });
    if (response.statusCode >= 400) {
      throw new Error(`HTTP Error: ${response.statusCode}`);
    }
    logger.log('SUCCESS! Posted', snap.ref);
  }
);
