'use strict';

const requestHelper = require('../../util/requestHelper');

let ips = [];

if (!process.env.AUTH_IPS) {
  console.info(
    "Set AUTH_IPS env var to allow authentication by request IP address " +
    "(comma separated list of IP addresses). Currently no addresses set."
  )
} else {
  ips = process.env.AUTH_IPS.split(',').map(ip => ip.trim());
  console.info(
    "The following IP addresses are enabled (AUTH_IPS env var): " + ips
  )
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
