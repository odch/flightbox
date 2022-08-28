import { getPagination } from './pagination';
import { takeEvery, takeLatest } from 'redux-saga'
import { put, call, select, fork, all } from 'redux-saga/effects'
import { initialize, destroy, getFormValues } from 'redux-form'
import createChannel, { monitor } from '../../util/createChannel';
import * as actions from './actions';
import * as remote from './remote';
import {localToFirebase, firebaseToLocal, transferValues, compareDescending} from '../../util/movements';
import { error } from '../../util/log';
import dates from '../../util/dates';
import ImmutableItemsArray from '../../util/ImmutableItemsArray';
import getAssociations, {getAssociatedMovement} from './associate';
import firebase from '../../util/firebase';

export const stateSelector = state => state.movements;
export const settingsSelector = state => state.settings;

export const movementSelector = (state, key) => state.movements.data.getByKey(key);

export const wizardFormValuesSelector = getFormValues('wizard');

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

export function* loadLatestDeparturesAndArrivalsPaged(movements, clear) {
  const pagination = getPagination(clear ? [] : movements.data.array);

  const departures = yield call(
    remote.loadLimited,
    '/departures',
    pagination.start,
    pagination.limit
  );

  const oldestDeparture = getOldest(departures.snapshot);

  let arrivalsLimit = null;
  let arrivalsEnd = null;

  if (oldestDeparture) {
    arrivalsEnd = oldestDeparture.negativeTimestamp;
  } else {
    arrivalsLimit = pagination.limit;
  }

  const arrivals = yield call(
    remote.loadLimited,
    '/arrivals',
    pagination.start,
    arrivalsLimit,
    arrivalsEnd
  );

  return {departures, arrivals};
}

export function* getHomeBaseAircrafts() {
  const {aircrafts: aircraftSettings} = yield select(settingsSelector);

  const homeBaseAircrafts = new Set();
  addAircraft(aircraftSettings.club, homeBaseAircrafts);
  addAircraft(aircraftSettings.homeBase, homeBaseAircrafts);

  return homeBaseAircrafts;
}

export function* addMovements(departuresSnapshot, arrivalsSnapshot, existingMovements, channel) {
  const movements = [];

  departuresSnapshot.forEach(transformToLocal(movements, 'departure'));
  arrivalsSnapshot.forEach(transformToLocal(movements, 'arrival'));

  const newData = existingMovements.insertAll(movements, compareDescending);

  channel.put(actions.setMovements(newData));
}

export function* associateMovements(channel) {
  const homeBaseAircrafts = yield call(getHomeBaseAircrafts);
  const {data} = yield select(stateSelector);

  const associations = getAssociations(data.array, homeBaseAircrafts);
  channel.put(actions.setAssociatiatedMovements(associations));

  const associationsToLoad = data.array.filter(item => associations[item.key] === undefined);
  yield call(loadAssociatedMovements, associationsToLoad, homeBaseAircrafts, channel);
}

export function* loadAssociatedMovements(movements, homeBaseAircrafts, channel) {
  const callEvents = movements.map(movement => call(loadAssociatedMovement, movement, homeBaseAircrafts, channel));
  const results = yield all(callEvents);
  const associatedMovements = results.reduce((acc, result) => ({
    ...acc,
    [result.movement.key]: result.associatedMovement
  }), {});
  channel.put(actions.setAssociatiatedMovements(associatedMovements));
}

export function* loadAssociatedMovement(movement, homeBaseAircrafts, channel) {
  const relevantMovements = yield call(getMovementsByImmatriculation, movement.immatriculation, channel);

  const isHomeBase = homeBaseAircrafts.has(movement.immatriculation);

  const associatedMovement = getAssociatedMovement(movement, isHomeBase, relevantMovements.array) || null;

  return {
    movement,
    associatedMovement
  };
}

export function* getMovementsByImmatriculation(immatriculation, channel) {
  const {byImmatriculation} = yield select(stateSelector);

  if (byImmatriculation[immatriculation]) {
    return byImmatriculation[immatriculation];
  }

  const departures = yield call(loadByImmatriculation, '/departures', immatriculation);
  const arrivals = yield call(loadByImmatriculation, '/arrivals', immatriculation);

  // monitor all loaded movements to remove associated movements which aren't present
  // in the loaded movement list but are older
  const eventActions = {
    added: actions.immatriculationMovementAdded,
    changed: actions.immatriculationMovementChanged,
    removed: actions.immatriculationMovementDeleted
  }
  yield call(monitorRef, departures.ref, channel, 'departure', eventActions);
  yield call(monitorRef, arrivals.ref, channel, 'arrival', eventActions);

  const movements = [];

  departures.snapshot.forEach(transformToLocal(movements, 'departure'));
  arrivals.snapshot.forEach(transformToLocal(movements, 'arrival'));

  const arr = new ImmutableItemsArray().insertAll(movements, compareDescending);

  channel.put(actions.setMovementsByImmatriculation(immatriculation, arr));

  return arr;
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
  const {data, byImmatriculation} = currentState;

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

    if (byImmatriculation[movement.immatriculation]) {
      const newByImmatriculation = byImmatriculation[movement.immatriculation].insert(movement, compareDescending);
      channel.put(actions.setMovementsByImmatriculation(movement.immatriculation, newByImmatriculation));
    }

    channel.put(actions.setMovements(newData));
  }
}

export function* removeMovementFromState(snapshot, channel) {
  const {data, byImmatriculation} = yield select(stateSelector);

  const newState = {
    byImmatriculation
  };

  const immatriculation = snapshot.val().immatriculation;

  if (byImmatriculation[immatriculation]) {
    newState.byImmatriculation[immatriculation] = byImmatriculation[immatriculation].remove(snapshot.key)
    channel.put(
      actions.setMovementsByImmatriculation(
        immatriculation,
        newState.byImmatriculation[immatriculation]
      )
    );
  }

  newState.data = data.remove(snapshot.key);
  channel.put(actions.setMovements(newState.data));

  return newState;
}

export function* immatriculationMovementAdded(channel, action) {
  const {snapshot, movementType} = action.payload;
  const state = yield select(stateSelector);
  if (!state.data.getByKey(snapshot.key)) { // if movement is in loaded range, it get's handled by the movementAdded action
    yield call(addImmatriculationMovementToState, snapshot, movementType, state, channel);
  }
}

export function* immatriculationMovementChanged(channel, action) {
  const {snapshot, movementType} = action.payload;
  const state = yield select(stateSelector);
  if (!state.data.getByKey(snapshot.key)) { // if movement is in loaded range, it get's handled by the movementChanged action
    const currentState = yield call(removeImmatriculationMovementFromState, snapshot, channel);
    yield call(addImmatriculationMovementToState, snapshot, movementType, currentState, channel);
  }
}

export function* immatriculationMovementDeleted(channel, action) {
  const {snapshot} = action.payload;
  const state = yield select(stateSelector);
  if (!state.data.getByKey(snapshot.key)) { // if movement is in loaded range, it get's handled by the movementDeleted action
    yield call(removeImmatriculationMovementFromState, snapshot, channel);
  }
}

export function* addImmatriculationMovementToState(snapshot, movementType, currentState, channel) {
  const {data, byImmatriculation} = currentState;

  if (!byImmatriculation[snapshot.val().immatriculation].getByKey(snapshot.key)) {
    const movement = transformSnapshotToLocal(snapshot, movementType);

    const newByImmatriculation = byImmatriculation[movement.immatriculation].insert(movement, compareDescending);
    channel.put(actions.setMovementsByImmatriculation(movement.immatriculation, newByImmatriculation));

    channel.put(actions.setMovements(data)); // put SET_MOVEMENTS action with same data just to trigger `associateMovements`
  }
}

export function* removeImmatriculationMovementFromState(snapshot, channel) {
  const {data, byImmatriculation} = yield select(stateSelector);

  const immatriculation = snapshot.val().immatriculation;

  const newByImmatriculation = byImmatriculation[immatriculation].remove(snapshot.key);
  channel.put(
    actions.setMovementsByImmatriculation(
      immatriculation,
      newByImmatriculation
    )
  );

  channel.put(actions.setMovements(data)); // put SET_MOVEMENTS action with same data just to trigger `associateMovements`
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

  const movement = localToFirebase(values);

  const path = getPathByMovementType(movement.type);

  let key = movement.key;
  delete movement.key;

  delete movement.type;
  delete movement.associations;

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

const addAircraft = (map, set) => {
  Object.keys(map).forEach(aircraft => {
    if (map[aircraft] === true) {
      set.add(aircraft);
    }
  });
}

export function loadByImmatriculation(path, immatriculation) {
  return new Promise(resolve => {
    const ref = firebase(path)
      .orderByChild('immatriculation')
      .equalTo(immatriculation);
    ref.once('value', snapshot => {
      resolve({
        snapshot,
        ref
      });
    });
  });
}

export default function* sagas() {
  const channel = createChannel();

  yield [
    fork(monitor, channel),
    fork(takeEvery, actions.LOAD_MOVEMENTS, loadMovements, channel),
    fork(takeEvery, actions.SET_MOVEMENTS_FILTER, filterMovements, channel),
    fork(takeEvery, actions.SET_MOVEMENTS, associateMovements, channel),
    fork(takeEvery, actions.MOVEMENT_ADDED, movementAdded, channel),
    fork(takeEvery, actions.MOVEMENT_CHANGED, movementChanged, channel),
    fork(takeEvery, actions.MOVEMENT_DELETED, movementDeleted, channel),
    fork(takeEvery, actions.IMMATRICULATION_MOVEMENT_ADDED, immatriculationMovementAdded, channel),
    fork(takeEvery, actions.IMMATRICULATION_MOVEMENT_CHANGED, immatriculationMovementChanged, channel),
    fork(takeEvery, actions.IMMATRICULATION_MOVEMENT_DELETED, immatriculationMovementDeleted, channel),
    fork(takeEvery, actions.DELETE_MOVEMENT, deleteMovement),
    fork(takeEvery, actions.INIT_NEW_MOVEMENT, initNewMovement),
    fork(takeEvery, actions.INIT_NEW_MOVEMENT_FROM_MOVEMENT, initNewMovementFromMovement),
    fork(takeEvery, actions.SAVE_MOVEMENT, saveMovement),
    fork(takeLatest, actions.EDIT_MOVEMENT, editMovement),
  ]
}
