import jsonp from 'jsonp';
import Config from 'Config';

let ipToken = null;
let credentialsToken = null;

export default {

  setIpToken(token) {
    ipToken = token;
  },

  getIpToken() {
    if (ipToken === null) {
      throw new Error('IP token has not been set');
    }
    return ipToken;
  },

  setCredentialsToken(token) {
    credentialsToken = token;
  },

  getCredentialsToken() {
    if (credentialsToken === null) {
      throw new Error('Credentials token has not been set');
    }
    return credentialsToken;
  },

  getBestToken() {
    if (credentialsToken) {
      return credentialsToken;
    }
    return this.getIpToken();
  },

  loadIpToken(callback) {
    jsonp(Config.ipAuth, null, (error, result) => callback(result.token));
  },

  loadCredentialsToken(credentials, callback) {
    const url = Config.credentialsAuth + '?username=' + credentials.username + '&password=' + credentials.password;
    jsonp(url, null, (error, result) => callback(result.token));
  },
};
