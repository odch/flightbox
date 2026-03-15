
const post = (data?: object): Promise<string> =>
  new Promise((resolve, reject) => {
    fetch(`https://europe-west1-${__FIREBASE_PROJECT_ID__}.cloudfunctions.net/auth`, {
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


export const loadIpToken = (): Promise<string> => post({
  mode: 'ip'
});

export const loadCredentialsToken = (credentials: object): Promise<string> =>
  post(Object.assign({}, credentials, {
    mode: 'flightnet',
    company: __FLIGHTNET_COMPANY__
  }));

export const loadGuestToken = (queryToken: string): Promise<string> =>
  post({
    mode: 'guest_token',
    token: queryToken
  });

export const loadKioskToken = (queryToken: string): Promise<string> =>
  post({
    mode: 'kiosk_token',
    token: queryToken
  });
