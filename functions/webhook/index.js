const functions = require('firebase-functions')
const admin = require('firebase-admin')
const request = require('request-promise');

// Prevent firebase from initializing twice
try {
  admin.initializeApp()
} catch (e) {}


module.exports = functions.database.ref('status/{statusId}').onCreate(async (snap) => {
  const r = await admin.database().ref("settings/webhookUrl").once('value')
  const webhook_url = r.val();
  if (webhook_url == null || webhook_url == "") {
    functions.logger.log('Webhook disabled', snap.ref);
    return;
  }
  functions.logger.log('Webhook started', snap.ref, webhook_url);
  const message = {"text": snap.val().details};
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
  functions.logger.log('SUCCESS! Posted', snap.ref);
});
