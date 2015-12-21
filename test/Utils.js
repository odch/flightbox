class Utils {
  static callTracker() {
    const calls = [];
    const f = (...args) => {
      calls.push(args);
    };
    f.calls = () => {
      return calls;
    };
    return f;
  }
}

export default Utils;
