import firebase from '../../util/firebase';

export function load(username) {
  return new Promise(resolve => {
    const ref = firebase(`/profiles/${username}`);
    ref.once('value', snapshot => {
      resolve(snapshot);
    });
  });
}

export function save(username, profile) {
  return new Promise((resolve, reject) => {
    firebase(`/profiles/${username}`, (error, ref) => {
      ref.update(profile, commitError => {
        if (commitError) {
          reject(commitError);
        } else {
          resolve();
        }
      });
    });
  });
}
