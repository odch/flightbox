import {getPagination, toOrderKey} from './pagination';
import {takeEvery, takeLatest} from 'redux-saga'
import {call, fork, put, select} from 'redux-saga/effects'
import {destroy, getFormValues, initialize} from 'redux-form'
import createChannel, {monitor} from '../../util/createChannel';
import * as actions from './actions';
import * as remote from './remote';
import {addMovementAssociationListener, removeMovementAssociationListener} from './remote';
import {compareDescending, firebaseToLocal, localToFirebase, transferValues} from '../../util/movements';
import {error} from '../../util/log';
import dates from '../../util/dates';
import ImmutableItemsArray from '../../util/ImmutableItemsArray';

export const stateSelector = state => state.movements;

export const movementSelector = (state, key) => state.movements.data.getByKey(key);

export const wizardFormValuesSelector = getFormValues('wizard');

export const authSelector = state => state.auth.data

export function* getDepartureDefaultValues() {
  return {
    type: 'departure',
    date: dates.localDate(),
    time: dates.localTimeRounded(15, 'up'),
  };
}

export function* getArrivalDefaultValues() {
  return {
    type: 'arrival',
    date: dates.localDate(),
    time: dates.localTimeRounded(15, 'down'),
  };
}

export function* getDefaultValuesFromArrival(arrivalKey) {
  const snapshot = yield call(remote.loadByKey, '/arrivals', arrivalKey);

  const initialValues = yield call(getDepartureDefaultValues);

  const val = snapshot.val();
  if (val) {
    const arrival = firebaseToLocal(val);
    transferValues(arrival, initialValues, [
      'immatriculation',
      'aircraftType',
      'mtow',
      'aircraftCategory',
      'memberNr',
      'lastname',
      'firstname',
      'email',
      'phone',
      { name: 'passengerCount', defaultValue: 0 },
      'location',
      'flightType',
    ]);
  }

  return initialValues;
}

export function* getDefaultValuesFromDeparture(departureKey) {
  const snapshot = yield call(remote.loadByKey, '/departures', departureKey);

  const initialValues = yield call(getArrivalDefaultValues);

  const val = snapshot.val();
  if (val) {
    const departure = firebaseToLocal(val);
    transferValues(departure, initialValues, [
      'immatriculation',
      'aircraftType',
      'mtow',
      'aircraftCategory',
      'memberNr',
      'lastname',
      'firstname',
      'email',
      'phone',
      { name: 'passengerCount', defaultValue: 0 },
      'location',
      'flightType',
    ]);

    if (departure.departureRoute === 'circuits') {
      initialValues.arrivalRoute = 'circuits';
    }
  }

  return initialValues;
}

export function getOldest(snapshot) {
  let oldest = null;
  snapshot.forEach(item => {
    const val = item.val();
    if (!oldest || oldest.negativeTimestamp < val.negativeTimestamp) {
      oldest = val
    }
  });
  return oldest;
}

export function* filterMovements() {
  yield put(actions.loadMovements(true));
}

export function* loadMovements(channel, action) {
  try {
    const {clear} = action.payload;

    const movements = yield select(stateSelector);
    if (movements.loading !== true) {
      yield put(actions.setMovementsLoading());

      const { departures, arrivals } = yield call(loadDeparturesAndArrivals, movements, clear);

      const eventActions = {
        added: actions.movementAdded,
        changed: actions.movementChanged,
        removed: actions.movementDeleted
      };

      yield call(monitorRef, departures.ref, channel, 'departure', eventActions);
      yield call(monitorRef, arrivals.ref, channel, 'arrival', eventActions);

      const existingMovements = clear ? new ImmutableItemsArray() : movements.data;

      yield call(addMovements, departures.snapshot, arrivals.snapshot, existingMovements, channel);

      if (clear) {
        yield put(actions.clearMovementsByKey())
        yield put(actions.clearAssociatedMovements())
      }
    }
  } catch(e) {
    error('Failed to load movements', e);
    channel.put(actions.loadMovementsFailure());
  }
}

export function* loadDeparturesAndArrivals(movements, clear) {
  if (movements.filter.date.start && movements.filter.date.end) {
    return yield call(loadDeparturesAndArrivalsFiltered, movements);
  } else {
    return yield call(loadLatestDeparturesAndArrivalsPaged, movements, clear);
  }
}

export function* loadDeparturesAndArrivalsFiltered(movements) {
  // start and end is the other way round because we're sorting (ascending) by negative timestamp
  // (we can't fetch data sorted descending in firebase)
  const start = dates.negativeTimestampEndOfDay(movements.filter.date.end);
  const end = dates.negativeTimestampStartOfDay(movements.filter.date.start);

  const departures = yield call(
    remote.loadLimited,
    '/departures',
    start,
    null,
    end
  );

  const arrivals = yield call(
    remote.loadLimited,
    '/arrivals',
    start,
    null,
    end
  );

  return {departures, arrivals};
}

export function getReloadParams(movements) {
  const oldestDeparture = getOldest(movements.departures.snapshot);
  const oldestArrival = getOldest(movements.arrivals.snapshot);

  if (oldestDeparture && oldestArrival) {
    if (oldestDeparture.negativeTimestamp > oldestArrival.negativeTimestamp) {
      // departure is older -> reload arrivals with new pagination
      return {
        reloadType: 'arrivals',
        reloadEnd: oldestDeparture.negativeTimestamp
      }
    } else {
      // arrival is older -> reload departures with new pagination
      return {
        reloadType: 'departures',
        reloadEnd: oldestArrival.negativeTimestamp
      }
    }
  }

  if (oldestDeparture) {
    // no arrivals -> reload arrivals with new pagination
    return {
      reloadType: 'arrivals',
      reloadEnd: oldestDeparture.negativeTimestamp
    }
  }

  if (oldestArrival) {
    // no departures -> reload departures with new pagination
    return {
      reloadType: 'departures',
      reloadEnd: oldestArrival.negativeTimestamp
    }
  }

  return null
}

export function* loadLatestDeparturesAndArrivalsPaged(movements, clear) {
  const auth = yield select(authSelector);

  const pagination = getPagination(clear ? [] : movements.data.array);

  const departures = yield call(
    remote.loadLimited,
    '/departures',
    pagination.start,
    pagination.limit,
    undefined,
    !auth.admin ? auth.email : undefined
  );

  const arrivals = yield call(
    remote.loadLimited,
    '/arrivals',
    pagination.start,
    pagination.limit,
    undefined,
    !auth.admin ? auth.email : undefined
  );

  const loadedMovements = {
    departures,
    arrivals
  }

  // make sure we load both collections until oldest in pagination
  const reloadParams = getReloadParams(loadedMovements)

  if (reloadParams) {
    loadedMovements[reloadParams.reloadType] = yield call(
      remote.loadLimited,
      `/${reloadParams.reloadType}`,
      pagination.start,
      undefined,
      reloadParams.reloadEnd,
      !auth.admin ? auth.email : undefined
    )
  }

  return loadedMovements
}

export function* addMovements(departuresSnapshot, arrivalsSnapshot, existingMovements, channel) {
  const movements = [];

  departuresSnapshot.forEach(transformToLocal(movements, 'departure'));
  arrivalsSnapshot.forEach(transformToLocal(movements, 'arrival'));

  const newData = existingMovements.insertAll(movements, compareDescending);

  yield call(monitorAssociations, newData, existingMovements, channel)

  channel.put(actions.setMovements(newData));
}

export function* monitorAssociations(newMovements, oldMovements, channel) {
  newMovements.array
    .filter(movement => !oldMovements.containsKey(movement.key))
    .forEach(movement => monitorAssociation(movement, channel))

  oldMovements.array
    .filter(movement => !newMovements.containsKey(movement.key))
    .forEach(movement => removeMovementAssociationListener(movement.type, movement.key))
}

export function monitorAssociation(movement, channel) {
  addMovementAssociationListener(movement.type, movement.key, (snapshot) => {
    channel.put(actions.setAssociatedMovement(movement.type, movement.key, snapshot.val()));
  })
}

export function* monitorRef(ref, channel, movementType, eventActions) {
  ref.off('child_added');
  ref.off('child_changed');
  ref.off('child_removed');

  const childAdded = createDelegate(channel, eventActions.added, movementType);
  const childChanged = createDelegate(channel, eventActions.changed, movementType);
  const childRemoved = createDelegate(channel, eventActions.removed, movementType);

  ref.on('child_added', childAdded);
  ref.on('child_changed', childChanged);
  ref.on('child_removed', childRemoved);
}

export function createDelegate(channel, action, movementType) {
  return snapshot => channel.put(action(snapshot, movementType))
}

export function* movementAdded(channel, action) {
  const {snapshot, movementType} = action.payload;
  const state = yield select(stateSelector);
  yield call(addMovementToState, snapshot, movementType, state, channel);
}

export function* movementChanged(channel, action) {
  const {snapshot, movementType} = action.payload;
  const currentState = yield call(removeMovementFromState, snapshot, channel);
  yield call(addMovementToState, snapshot, movementType, currentState, channel);
}

export function* movementDeleted(channel, action) {
  const {snapshot} = action.payload;
  yield call(removeMovementFromState, snapshot, channel);
}

export function* addMovementToState(snapshot, movementType, currentState, channel) {
  const {data} = currentState;

  if (!data.getByKey(snapshot.key)) {
    const movement = transformSnapshotToLocal(snapshot, movementType);

    const newData = data.insert(movement, compareDescending);

    // if is last element, it was added to the range only because a movement
    // in the range was deleted. to prevent the `movementAdded` callback
    // from messing up the state, because it's executed parallel to the
    // `movementDeleted` callback, we ignore it here.
    if (newData.array[newData.array.length - 1].key === movement.key) {
      return;
    }

    yield call(monitorAssociation, movement, channel)

    channel.put(actions.setMovements(newData));
  }
}

export function* removeMovementFromState(snapshot, channel) {
  const {data} = yield select(stateSelector);

  const movement = data.getByKey(snapshot.key)

  const newState = {
    data: data.remove(snapshot.key)
  };

  yield call(removeMovementAssociationListener, movement.type, movement.key)

  channel.put(actions.setMovements(newState.data));

  return newState;
}

export function* loadMovement(action) {
  const {key, type} = action.payload;

  const path = getPathByMovementType(type);
  const snapshot = yield call(remote.loadByKey, path, key);

  const movement = firebaseToLocal(snapshot.val());
  movement.key = snapshot.key;
  movement.type = type;

  yield put(actions.addMovementByKey(movement));
}

export function* deleteMovement(action) {
  const {movementType, key, successAction} = action.payload;
  yield call(remote.removeMovement, getPathByMovementType(movementType), key);
  yield put(successAction());
}

export function* initNewMovement(action) {
  const {movementType} = action.payload;
  const loadInitialValuesSaga = movementType === 'departure'
    ? getDepartureDefaultValues
    : getArrivalDefaultValues;
  yield call(initMovement, loadInitialValuesSaga);
}

export function* initNewMovementFromMovement(action) {
  const {movementType, sourceMovementKey} = action.payload;
  const loadInitialValuesSaga = movementType === 'departure'
    ? getDefaultValuesFromArrival
    : getDefaultValuesFromDeparture;
  yield call(initMovement, loadInitialValuesSaga, sourceMovementKey);
}

export function* initMovement(loadInitialValuesSaga, ...loadInitialValuesArgs) {
  yield put(actions.startInitializeWizard());
  yield put(destroy('wizard'));
  const initialValues = yield call(loadInitialValuesSaga, ...loadInitialValuesArgs);
  yield put(initialize('wizard', initialValues));
  yield put(actions.wizardInitialized());
}

export function* editMovement(action) {
  const {movementType, key} = action.payload;
  yield put(actions.startInitializeWizard());
  yield put(destroy('wizard'));
  let movement = yield(select(movementSelector, key));
  if (!movement) {
    const path = getPathByMovementType(movementType);
    const snapshot = yield(call(remote.loadByKey, path, key));
    movement = firebaseToLocal(snapshot.val());
    movement.key = snapshot.key;
    movement.type = movementType;
  }
  yield put(initialize('wizard', movement));
  yield put(actions.wizardInitialized());
}

export function* saveMovement() {
  const values = yield select(wizardFormValuesSelector);
  const auth = yield select(authSelector);

  const movement = localToFirebase(values);

  const path = getPathByMovementType(movement.type);

  let key = movement.key;
  delete movement.key;

  delete movement.type;
  delete movement.associatedMovement;

  if (auth.email) {
    movement.createdBy = auth.email
    movement.createdBy_orderKey = toOrderKey(auth.email, movement.negativeTimestamp)
  }

  try {
    key = yield call(remote.saveMovement, path, key, movement);
    yield put(actions.saveMovementSuccess(key, values))
  } catch(e) {
    if (console && typeof console.error === 'function') {
      console.error('Failed to save movement', e);
      console.error('movement', movement);
    }
    yield put(actions.saveMovementFailed(e))
  }
}

export function* saveMovementPaymentMethod(action) {
  const {movementType, key, paymentMethod} = action.payload;
  const path = getPathByMovementType(movementType);
  try {
    yield call(remote.saveMovement, path, key, {
      paymentMethod
    });
  } catch(e) {
    if (console && typeof console.error === 'function') {
      console.error('Failed to save movement payment method', e);
      console.error('movement key', key);
    }
  }
}

function getPathByMovementType(type) {
  switch(type) {
    case 'departure':
      return '/departures';
    case 'arrival':
      return '/arrivals';
    default:
      throw new Error('Unknown movement type ' + type);
  }
}


const transformSnapshotToLocal = (snapshot, movementType) => {
  const movement = firebaseToLocal(snapshot.val());
  movement.key = snapshot.key;
  movement.type = movementType;
  return movement;
}

const transformToLocal = (movements, movementType) => item => {
  const movement = transformSnapshotToLocal(item, movementType);
  movements.push(movement);
}

export default function* sagas() {
  const channel = createChannel();

  yield [
    fork(monitor, channel),
    fork(takeEvery, actions.LOAD_MOVEMENTS, loadMovements, channel),
    fork(takeEvery, actions.SET_MOVEMENTS_FILTER, filterMovements, channel),
    fork(takeEvery, actions.MOVEMENT_ADDED, movementAdded, channel),
    fork(takeEvery, actions.MOVEMENT_CHANGED, movementChanged, channel),
    fork(takeEvery, actions.MOVEMENT_DELETED, movementDeleted, channel),
    fork(takeEvery, actions.LOAD_MOVEMENT, loadMovement),
    fork(takeEvery, actions.DELETE_MOVEMENT, deleteMovement),
    fork(takeEvery, actions.INIT_NEW_MOVEMENT, initNewMovement),
    fork(takeEvery, actions.INIT_NEW_MOVEMENT_FROM_MOVEMENT, initNewMovementFromMovement),
    fork(takeEvery, actions.SAVE_MOVEMENT, saveMovement),
    fork(takeEvery, actions.SAVE_MOVEMENT_PAYMENT_METHOD, saveMovementPaymentMethod),
    fork(takeLatest, actions.EDIT_MOVEMENT, editMovement),
  ]
}
