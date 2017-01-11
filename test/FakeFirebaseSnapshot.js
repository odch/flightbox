export default class FakeFirebaseSnapshot {

  constructor(key, val) {
    this._key = key;
    this._val = val;
  }

  key() {
    return this._key;
  }

  val() {
    return this._val;
  }

  forEach(fn) {
    if (Array.isArray(this._val)) {
      this._val.forEach(fn);
    } else {
      throw new Error('Only supported for arrays');
    }
  }
}
