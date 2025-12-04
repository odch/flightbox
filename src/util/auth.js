
const post = (data) =>
  new Promise((resolve, reject) => {
    fetch(`https://us-central1-${__FIREBASE_PROJECT_ID__}.cloudfunctions.net/auth`, {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json'
      }),
      body: data ? JSON.stringify(data) : null
    }).then(response => {
      response.json().then(json => resolve(json.token));
    }).catch(e => {
      reject(e);
    });
  });


export const loadIpToken = () => post({
  mode: 'ip'
});

export const loadCredentialsToken = credentials =>
  post(Object.assign({}, credentials, {
    mode: 'flightnet',
    company: __FLIGHTNET_COMPANY__
  }));

export const loadGuestToken = queryToken =>
  post({
    mode: 'guest_token',
    token: queryToken
  });

export const loadKioskToken = queryToken =>
  post({
    mode: 'kiosk_token',
    token: queryToken
  });
