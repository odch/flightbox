import jsonp from 'jsonp';
import Config from 'Config';
import Cookies from 'js-cookie';

export default {

  /**
   * @param auth Object containing `uid` and `token` string and expiration date
   * */
  setAuthCookie(auth) {
    if (!auth) {
      Cookies.remove('auth');
    } else {
      const value = auth.uid + ':' + auth.expiration.getTime() + ':' + auth.token;
      Cookies.set('auth', value, { expires: auth.expiration });
    }
  },

  /**
   * @return an object containing `uid` and `token` string and expiration date in ms
   * */
  getAuthCookie() {
    const cookie = Cookies.get('auth');
    if (cookie) {
      const parts = cookie.split(':');
      return {
        uid: parts[0],
        expiration: parts[1],
        token: parts[2],
      };
    }
    return null;
  },

  loadIpToken(callback) {
    jsonp(Config.ipAuth, null, (error, result) => callback(result.token));
  },

  loadCredentialsToken(credentials, callback) {
    const url = Config.credentialsAuth + '?username=' + credentials.username + '&password=' + credentials.password;
    jsonp(url, null, (error, result) => callback(result.token));
  },
};
