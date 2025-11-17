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
  return new Promise(async (resolve, reject) => {
    try {
      const ref = firebase(`/profiles/${username}`);
      await ref.update(profile);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}
