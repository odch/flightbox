import jsonp from 'jsonp';
import Config from 'Config';

export default {

  loadIpToken() {
    return new Promise((resolve, reject) => {
      jsonp(Config.ipAuth, null, (error, result) => {
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
      const url = Config.credentialsAuth + '?username=' + credentials.username + '&password=' + credentials.password;
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
