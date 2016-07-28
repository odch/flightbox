import jsonp from 'jsonp';

export default {

  loadIpToken() {
    return new Promise((resolve, reject) => {
      jsonp(__IP_AUTH__, null, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.token);
        }
      });
    });
  },

  loadCredentialsToken(credentials) {
    return () => new Promise((resolve, reject) => {
      const url = __CREDENTIALS_AUTH__ + '?username=' + credentials.username + '&password=' + credentials.password;
      jsonp(url, null, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.token);
        }
      });
    });
  },
};
