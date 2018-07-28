'use strict';

const soap = require('soap');

const wsdl = 'https://www.flightnet.aero/APIWS/ReservationService.svc?wsdl';

const createClient = () => new Promise((resolve, reject) => {
  soap.createClient(wsdl, (err, client) => {
    if (err) {
      console.error('Failed to create client', err);
      reject(err);
    } else {
      resolve(client);
    }
  })
});

const getApiKey = (client, args) => new Promise((resolve, reject) => {
  client.GetAPIKey(args, (err, result) => {
    if (err) {
      console.error('Failed to get API key', err);
      reject(err);
    } else {
      resolve(result.GetAPIKeyResult);
    }
  });
});

const passwordCheck = (company, username, password) =>
  createClient().then(client => {
    const args = {
      company: company,
      username: username,
      password: password
    };
    return getApiKey(client, args);
  }).then(apiKey => !!apiKey);

module.exports = {
  passwordCheck: passwordCheck
};
