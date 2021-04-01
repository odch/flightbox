const functions = require('firebase-functions')
const request = require('request-promise');

module.exports = functions.database.ref('status').onCreate(async (snap) => {
  const webhook_url = await firebase.database().ref("settings/webhookUrl").once('value');
  if (webhook_url == null) {
    functions.logger.log('Webhook disabled', snap.ref);
    return;
  }
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
