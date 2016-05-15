import jsonp from 'jsonp';
import Config from 'Config';
import Cookies from 'js-cookie';

let ipToken = null;
let credentialsAuth = null;

const cookie = Cookies.get('auth');
if (cookie) {
  const parts = cookie.split(':');
  credentialsAuth = {
    uid: parts[0],
    expiration: parts[1],
    token: parts[2],
  };
}

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

  /**
   * @param auth Object containing `uid` and `token` string and expiration date
   * */
  setCredentialsAuth(auth) {
    credentialsAuth = auth;
    if (!credentialsAuth) {
      Cookies.remove('auth');
    } else {
      const value = auth.uid + ':' + auth.expiration.getTime() + ':' + auth.token;
      Cookies.set('auth', value, { expires: auth.expiration });
    }
  },

  getCredentialsAuth() {
    return credentialsAuth;
  },

  getBestToken() {
    if (credentialsAuth) {
      return credentialsAuth.token;
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
