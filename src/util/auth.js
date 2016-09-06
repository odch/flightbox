import jsonp from 'jsonp';
import Cookies from 'js-cookie';
import moment from 'moment';

function isExpired(expirationDate) {
  return moment(expirationDate).isBefore(moment());
}

function post(url) {
  return new Promise(resolve => {
    fetch(url, {
      method: 'POST',
    }).then(response => {
      response.json().then(json => resolve(json));
    });
  });
}

export default {

  /**
   * @param {Object} auth Object containing `uid` and `token` string and expiration date
   * */
  setAuthCookie(auth) {
    if (!auth) {
      Cookies.remove('auth');
    } else {
      const value = auth.uid + ':' + auth.expiration.getTime() + ':' + auth.token;
      Cookies.set('auth', value); // no expires field, should expire when session is closed
    }
  },

  /**
   * @return {Object} an object containing `uid` and `token` string and expiration date
   * */
  getAuthCookie() {
    const cookie = Cookies.get('auth');
    if (cookie) {
      const parts = cookie.split(':');
      const [uid, expiration, token] = parts;
      const expirationDate = new Date(parseInt(expiration, 10));
      if (!isExpired(expirationDate)) { // session cookie could outlive token expiration
        return {
          uid,
          expiration: expirationDate,
          token,
        };
      }
    }
    return null;
  },

  loadIpToken(callback) {
    post(__IP_AUTH__).then(result => callback(result.token));
  },

  loadCredentialsToken(credentials, callback) {
    const url = __CREDENTIALS_AUTH__ + '?username=' + credentials.username + '&password=' + credentials.password;
    post(url).then(result => callback(result.token));
  },
};
