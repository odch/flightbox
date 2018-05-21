export default class FakeFirebaseSnapshot {

  constructor(key, val) {
    this.key = key;
    this._val = val;
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
