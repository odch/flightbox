'use strict';

const functions = require('firebase-functions');
const requestHelper = require('../../util/requestHelper');

let ips = [];

const config = functions.config();
if (!config.auth || !config.auth.ips) {
  console.info(
    "Set configuration property auth.ips to allow authentication by request IP address " +
    "(comma separated list of IP addresses). Currently no addresses set."
  )
} else {
  ips = config.auth.ips.split(',').map(ip => ip.trim());
}

module.exports = req =>
  new Promise(resolve => {
    const requestIp = requestHelper.getIp(req);
    console.info('Request IP', requestIp);
    console.info('Allowed IPs', ips);
    if (requestIp && ips.includes(requestIp)) {
      resolve('ipauth');
    } else {
      resolve(null);
    }
  });
