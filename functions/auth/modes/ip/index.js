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
    if (requestIp && ips.includes(requestIp)) {
      console.info(`Request IP ${requestIp} present in allowed IPs ${ips}. Returning 'ipauth' uid.`)
      resolve('ipauth');
    } else {
      console.info(`Request IP ${requestIp} not present in allowed IPs ${ips}`)
      resolve(null);
    }
  });
