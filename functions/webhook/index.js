const { onValueCreated } = require('firebase-functions/v2/database');
const { defineString } = require('firebase-functions/params');
const { logger } = require('firebase-functions/v2');
const admin = require('firebase-admin');

const RTDB_INSTANCE = defineString('RTDB_INSTANCE');
const RTDB_REGION = defineString('RTDB_REGION', { default: 'europe-west1' });

module.exports = onValueCreated(
  {
    region: `{{ params.${RTDB_REGION.name} }}`,
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

    // Only post to a valid https URL; reject other schemes to avoid SSRF to
    // internal/non-TLS endpoints.
    let url;
    try {
      url = new URL(webhook_url);
    } catch (e) {
      logger.warn('Invalid webhook URL, skipping', snap.ref);
      return;
    }
    if (url.protocol !== 'https:') {
      logger.warn('Webhook URL must use https, skipping', snap.ref);
      return;
    }

    logger.log('Webhook started', snap.ref, webhook_url);
    const response = await fetch(webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: snap.val().details }),
      redirect: 'error', // do not follow redirects (SSRF pivot guard)
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    logger.log('SUCCESS! Posted', snap.ref);
  }
);
