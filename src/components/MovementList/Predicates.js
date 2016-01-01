class Predicates {

  static today(movement) {
    const movementDateString = movement.date;
    return movementDateString && new Date(movementDateString).toDateString() === new Date().toDateString();
  }

  static yesterday(movement) {
    const movementDateString = movement.date;
    if (movementDateString) {
      const today = new Date();
      today.setDate(today.getDate() - 1);
      return new Date(movementDateString).toDateString() === today.toDateString();
    }
    return false;
  }

  static thisMonth(movement) {
    const movementDateString = movement.date;
    if (movementDateString) {
      const today = new Date();
      const movementDate = new Date(movementDateString);
      if (today.getMonth() === movementDate.getMonth()
        && today.getFullYear() === movementDate.getFullYear()) {
        return true;
      }
    }
    return false;
  }

  static olderThanThisMonth(movement) {
    const movementDateString = movement.date;
    if (movementDateString) {
      const today = new Date();
      const movementDate = new Date(movementDateString);
      if (today.getMonth() > movementDate.getMonth()
        && today.getFullYear() >= movementDate.getFullYear()) {
        return true;
      }
    }
    return false;
  }

  static not(predicate) {
    return (item) => {
      return !predicate(item);
    };
  }

  static and(/* predicates */) {
    const predicates = arguments;
    return (item) => {
      for (let i = 0; i < predicates.length; i++) {
        if (!predicates[i](item)) {
          return false;
        }
      }
      return true;
    };
  }
}

export default Predicates;
