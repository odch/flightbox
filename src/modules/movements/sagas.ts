import {onChildAdded, onChildChanged, onChildRemoved} from 'firebase/database';
import {getPagination, toOrderKey} from './pagination';
import {all, call, fork, put, select, takeEvery, takeLatest} from 'redux-saga/effects'
import createChannel, {monitor} from '../../util/createChannel';
import * as actions from './actions';
import * as remote from './remote';
import {addMovementAssociationListener, removeMovementAssociationListener} from './remote';
import {compareDescending, firebaseToLocal, localToFirebase, transferValues} from '../../util/movements';
import {error} from '../../util/log';
import dates from '../../util/dates';
import ImmutableItemsArray from '../../util/ImmutableItemsArray';
import {loadRemote} from '../profile'

export const stateSelector = (state: any) => state.movements;

export const movementSelector = (state: any, key: string) => state.movements.data.getByKey(key);

export const wizardFormValuesSelector = (state: any) => state.ui.wizard.values;

export const authSelector = (state: any) => state.auth.data;

export const privacyPolicyUrlSelector = (state: any) => state.settings.privacyPolicyUrl;

export function* getProfileDefaultValues() {
  const auth = yield select(authSelector)

  if (!auth || !auth.uid || auth.guest === true || auth.kiosk === true) {
    return {}
  }

  const snapshot = yield call(loadRemote, auth.uid);

  const p = snapshot.val() || {};
  const result: Record<string, any> = {};
  for (const key of ['memberNr', 'email', 'firstname', 'lastname', 'phone', 'immatriculation', 'aircraftCategory', 'aircraftType', 'mtow']) {
    if (key in p) result[key] = p[key];
  }
  return result;
}

export function* getDepartureDefaultValues() {
  const profileDefaultValues = yield call(getProfileDefaultValues)
  return {
    ...profileDefaultValues,
    type: 'departure',
    date: dates.localDate(),
    time: dates.localTimeRounded(15, 'up'),
  };
}

export function* getArrivalDefaultValues() {
  const profileDefaultValues = yield call(getProfileDefaultValues)
  return {
    ...profileDefaultValues,
    type: 'arrival',
    date: dates.localDate(),
    time: dates.localTimeRounded(15, 'down'),
  };
}

export function* getDefaultValuesFromArrival(arrivalKey: string) {
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

export function* getDefaultValuesFromDeparture(departureKey: string) {
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

export function getOldest(snapshot: any) {
  let oldest: any = null;
  snapshot.forEach((item: any) => {
    const val = item.val();
    if (!oldest || oldest.negativeTimestamp < val.negativeTimestamp) {
      oldest = val
    }
  });
  return oldest;
}

function hasFilterDateChanged(newFilter: any, previousFilter: any) {
  const newStart = newFilter.date.start
  const newEnd = newFilter.date.end

  const previousStart = previousFilter.date.start
  const previousEnd = previousFilter.date.end

  return newStart !== previousStart || newEnd !== previousEnd;
}

export function* filterMovements() {
  const {filter, previousFilter} = yield select(stateSelector);
  if (hasFilterDateChanged(filter, previousFilter)) {
    yield put(actions.loadMovements(true));
  }
}

export function* loadMovements(channel: any, action: any) {
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

      const existingMovements = clear ? new ImmutableItemsArray([]) : movements.data;

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

export function* loadDeparturesAndArrivals(movements: any, clear: boolean) {
  if (movements.filter.date.start && movements.filter.date.end) {
    return yield call(loadDeparturesAndArrivalsFiltered, movements);
  } else {
    return yield call(loadLatestDeparturesAndArrivalsPaged, movements, clear);
  }
}

export function* loadDeparturesAndArrivalsFiltered(movements: any) {
  // start and end is the other way round because we're sorting (ascending) by negative timestamp
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

export function getReloadParams(movements: any) {
  const oldestDeparture = getOldest(movements.departures.snapshot);
  const oldestArrival = getOldest(movements.arrivals.snapshot);

  if (oldestDeparture && oldestArrival) {
    if (oldestDeparture.negativeTimestamp > oldestArrival.negativeTimestamp) {
      return {
        reloadType: 'arrivals',
        reloadEnd: oldestDeparture.negativeTimestamp
      }
    } else {
      return {
        reloadType: 'departures',
        reloadEnd: oldestArrival.negativeTimestamp
      }
    }
  }

  if (oldestDeparture) {
    return {
      reloadType: 'arrivals',
      reloadEnd: oldestDeparture.negativeTimestamp
    }
  }

  if (oldestArrival) {
    return {
      reloadType: 'departures',
      reloadEnd: oldestArrival.negativeTimestamp
    }
  }

  return null
}

export function* loadLatestDeparturesAndArrivalsPaged(movements: any, clear: boolean) {
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

  const loadedMovements: any = {
    departures,
    arrivals
  }

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

export function* addMovements(departuresSnapshot: any, arrivalsSnapshot: any, existingMovements: any, channel: any) {
  const movements: any[] = [];

  departuresSnapshot.forEach(transformToLocal(movements, 'departure'));
  arrivalsSnapshot.forEach(transformToLocal(movements, 'arrival'));

  const auth = yield select(authSelector);

  const filteredMovements = auth.admin || !auth.email
    ? movements
    : movements.filter((movement: any) => movement.createdBy === auth.email)

  const newData = existingMovements.insertAll(filteredMovements, compareDescending);

  yield call(monitorAssociations, newData, existingMovements, channel)

  channel.put(actions.setMovements(newData));
}

export function* monitorAssociations(newMovements: any, oldMovements: any, channel: any) {
  newMovements.array
    .filter((movement: any) => !oldMovements.containsKey(movement.key))
    .forEach((movement: any) => monitorAssociation(movement, channel))

  oldMovements.array
    .filter((movement: any) => !newMovements.containsKey(movement.key))
    .forEach((movement: any) => removeMovementAssociationListener(movement.type, movement.key))
}

export function monitorAssociation(movement: any, channel: any) {
  addMovementAssociationListener(movement.type, movement.key, (snapshot) => {
    channel.put(actions.setAssociatedMovement(movement.type, movement.key, snapshot.val()));
  })
}

const movementListeners: Record<string, Array<() => void>> = { departure: [], arrival: [] };

export function* monitorRef(ref: any, channel: any, movementType: string, eventActions: any) {
  movementListeners[movementType].forEach(fn => fn());
  movementListeners[movementType] = [
    onChildAdded(ref, createDelegate(channel, eventActions.added, movementType)),
    onChildChanged(ref, createDelegate(channel, eventActions.changed, movementType)),
    onChildRemoved(ref, createDelegate(channel, eventActions.removed, movementType)),
  ];
}

export function createDelegate(channel: any, action: Function, movementType: string) {
  return (snapshot: any) => channel.put(action(snapshot, movementType))
}

export function* movementAdded(channel: any, action: any) {
  const {snapshot, movementType} = action.payload;
  const state = yield select(stateSelector);
  yield call(addMovementToState, snapshot, movementType, state, channel, true);
}

export function* movementChanged(channel: any, action: any) {
  const {snapshot, movementType} = action.payload;
  const currentState = yield call(removeMovementFromState, snapshot, channel);
  yield call(addMovementToState, snapshot, movementType, currentState, channel, false);
}

export function* movementDeleted(channel: any, action: any) {
  const {snapshot} = action.payload;
  yield call(removeMovementFromState, snapshot, channel);
}

export function* addMovementToState(snapshot: any, movementType: string, currentState: any, channel: any, applyFillInGuard = false) {
  const {data} = currentState;

  if (!data.getByKey(snapshot.key)) {
    const movement = transformSnapshotToLocal(snapshot, movementType);

    const auth = yield select(authSelector);
    if (!auth.admin && auth.email && movement.createdBy !== auth.email) {
      return;
    }

    const newData = data.insert(movement, compareDescending);

    if (applyFillInGuard && newData.array[newData.array.length - 1].key === movement.key) {
      return;
    }

    yield call(monitorAssociation, movement, channel)

    channel.put(actions.setMovements(newData));
  }
}

export function* removeMovementFromState(snapshot: any, channel: any) {
  const {data} = yield select(stateSelector);

  const movement = data.getByKey(snapshot.key)

  if (!movement) {
    return {
      data
    }
  }

  const newState = {
    data: data.remove(snapshot.key)
  };

  yield call(removeMovementAssociationListener, movement.type, movement.key)

  channel.put(actions.setMovements(newState.data));

  return newState;
}

export function* loadMovement(action: any) {
  const {key, type} = action.payload;

  const path = getPathByMovementType(type);
  const snapshot = yield call(remote.loadByKey, path, key);

  const movement = firebaseToLocal(snapshot.val());
  movement.key = snapshot.key;
  movement.type = type;

  yield put(actions.addMovementByKey(movement));
}

export function* deleteMovement(action: any) {
  const {movementType, key, successAction} = action.payload;
  yield call(remote.removeMovement, getPathByMovementType(movementType), key);
  yield put(successAction());
}

export function* initNewMovement(action: any) {
  const {movementType} = action.payload;
  const loadInitialValuesSaga = movementType === 'departure'
    ? getDepartureDefaultValues
    : getArrivalDefaultValues;
  yield call(initMovement, loadInitialValuesSaga);
}

export function* initNewMovementFromMovement(action: any) {
  const {movementType, sourceMovementKey} = action.payload;
  const loadInitialValuesSaga = movementType === 'departure'
    ? getDefaultValuesFromArrival
    : getDefaultValuesFromDeparture;
  yield call(initMovement, loadInitialValuesSaga, sourceMovementKey);
}

export function* initMovement(loadInitialValuesSaga: (...args: any[]) => any, ...loadInitialValuesArgs: unknown[]) {
  yield put(actions.startInitializeWizard());
  const initialValues = yield call(loadInitialValuesSaga, ...loadInitialValuesArgs);
  yield put(actions.wizardInitialized(initialValues));
}

export function* editMovement(action: any) {
  const {movementType, key} = action.payload;
  yield put(actions.startInitializeWizard());
  let movement = yield(select(movementSelector, key));
  if (!movement) {
    const path = getPathByMovementType(movementType);
    const snapshot = yield(call(remote.loadByKey, path, key));
    movement = firebaseToLocal(snapshot.val());
    movement.key = snapshot.key;
    movement.type = movementType;
  }
  yield put(actions.wizardInitialized(movement));
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
    movement.createdBy_orderKey = toOrderKey(auth.email, movement.negativeTimestamp as number)
  }

  if (!key) {
    const privacyPolicyUrl = yield select(privacyPolicyUrlSelector);
    if (privacyPolicyUrl) {
      movement.privacyPolicyAcceptedAt = new Date().toISOString()
    }
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

export function* saveMovementPaymentMethod(action: any) {
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

function getPathByMovementType(type: string) {
  switch(type) {
    case 'departure':
      return '/departures';
    case 'arrival':
      return '/arrivals';
    default:
      throw new Error('Unknown movement type ' + type);
  }
}

const transformSnapshotToLocal = (snapshot: any, movementType: string) => {
  const movement = firebaseToLocal(snapshot.val());
  movement.key = snapshot.key;
  movement.type = movementType;
  return movement;
}

const transformToLocal = (movements: any[], movementType: string) => (item: any) => {
  const movement = transformSnapshotToLocal(item, movementType);
  movements.push(movement);
}

export default function* sagas() {
  const channel = createChannel();

  yield all([
    fork(monitor, channel),
    takeEvery(actions.LOAD_MOVEMENTS, loadMovements, channel),
    takeEvery(actions.SET_MOVEMENTS_FILTER, filterMovements),
    takeEvery(actions.MOVEMENT_ADDED, movementAdded, channel),
    takeEvery(actions.MOVEMENT_CHANGED, movementChanged, channel),
    takeEvery(actions.MOVEMENT_DELETED, movementDeleted, channel),
    takeEvery(actions.LOAD_MOVEMENT, loadMovement),
    takeEvery(actions.DELETE_MOVEMENT, deleteMovement),
    takeEvery(actions.INIT_NEW_MOVEMENT, initNewMovement),
    takeEvery(actions.INIT_NEW_MOVEMENT_FROM_MOVEMENT, initNewMovementFromMovement),
    takeEvery(actions.SAVE_MOVEMENT, saveMovement),
    takeEvery(actions.SAVE_MOVEMENT_PAYMENT_METHOD, saveMovementPaymentMethod),
    takeLatest(actions.EDIT_MOVEMENT, editMovement),
  ])
}
