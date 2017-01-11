
const post = (url, data) =>
  new Promise((resolve, reject) => {
    fetch(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : null
    }).then(response => {
      response.json().then(json => resolve(json.token));
    }).catch(e => {
      reject(e);
    });
  });


export const loadIpToken = () => post(__IP_AUTH__);

export const loadCredentialsToken = credentials => post(__CREDENTIALS_AUTH__, credentials);
