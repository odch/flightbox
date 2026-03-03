import {all, call, put, takeEvery} from 'redux-saga/effects';
import moment from 'moment-timezone';
import * as actions from './actions';
import dates from '../../util/dates'
import {get as getAerodrome} from '../../util/aerodromes'
import {getIdToken} from '../../util/firebase.js'
import * as remote from '../movements/remote'

export const getCustomsAircraftType = (aircraftCategory: string) => {
  if (['Hubschrauber', 'Eigenbauhubschrauber'].includes(aircraftCategory)) {
    return 'helicopter'
  }
  return 'airplane'
}

export const parseDuration = (duration: string) => {
  const durationParts = duration.split(':');
  return {
    hours: parseInt(durationParts[0], 10),
    minutes: parseInt(durationParts[1], 10)
  };
}

export const calculateTimeWithDuration = (time: string, duration: string, operation = 'add') => {
  const timeMoment = moment(time, 'HH:mm');

  const { hours, minutes } = parseDuration(duration);

  const resultMoment = operation === 'add'
    ? timeMoment.add(hours, 'hours').add(minutes, 'minutes')
    : timeMoment.subtract(hours, 'hours').subtract(minutes, 'minutes');

  return resultMoment.format('HH:mm');
}

export const calculateArrivalTime = (departureTime: string, duration: string) => {
  return calculateTimeWithDuration(departureTime, duration, 'add');
}

export const getDirectionDependingData = async (movementData: any) => {
  const aerodrome = await getAerodrome(movementData.location)

  if (movementData.type === 'departure') {
    return {
      departureTime: movementData.time,
      arrivalCountry: (aerodrome as any).country,
      arrivalLocation: (aerodrome as any).name,
      arrivalTime: calculateArrivalTime(movementData.time, movementData.duration),
    }
  }

  return {
    arrivalTime: movementData.time,
    departureCountry: (aerodrome as any).country,
    departureLocation: (aerodrome as any).name,
  }
}

export const getCustomsPayload = async (movementData: any) => {
  return {
    aerodromeId: __CONF__.aerodrome.ICAO.toLowerCase(),
    externalId: movementData.key,
    data: {
      direction: movementData.type,
      date: dates.formatDate(movementData.date, 'de'),
      phone: movementData.phone,
      email: movementData.email,
      registration: movementData.immatriculation,
      mtow: movementData.mtow,
      aircraftType: getCustomsAircraftType(movementData.aircraftCategory),
      ...await getDirectionDependingData(movementData)
    }
  }
}

export const postPrepopulatedFormToCustoms = async (formData: unknown) => {
  const idToken = await getIdToken()
  const url = `https://europe-west1-${__FIREBASE_PROJECT_ID__}.cloudfunctions.net/api/customs/prepopulated-forms`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData)
  })

  if (!response.ok) {
    throw new Error(`Failed to post prepopulated form: ${response.status} ${response.statusText}`)
  }

  return await response.json()
}

export const getPathByMovementType = (type: string) => {
  switch(type) {
    case 'departure':
      return '/departures';
    case 'arrival':
      return '/arrivals';
    default:
      throw new Error('Unknown movement type ' + type);
  }
}

export const saveCustomsFormData = async (movementData: any, customsFormId: string, completionUrl: string) => {
  const path = getPathByMovementType(movementData.type)
  return remote.saveMovement(path, movementData.key, {
    customsFormId,
    customsFormUrl: completionUrl
  })
}

export const openCompletionUrl = (url: string) => {
  const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
  if (!newWindow) {
    console.warn('Popup blocked for completion URL:', url)
  }
}

export function* startCustoms(action: any) {
  const { movementData } = action.payload

  if (movementData.customsFormId && movementData.customsFormUrl) {
    openCompletionUrl(movementData.customsFormUrl)
    return
  }

  yield put(actions.setStartCustomsLoading())

  try {
    const payload = yield call(getCustomsPayload, movementData)
    const result = yield call(postPrepopulatedFormToCustoms, payload)

    if (result && result.id && result.completionUrl) {
      try {
        yield call(saveCustomsFormData, movementData, result.id, result.completionUrl)
      } catch (error) {
        console.error('Failed to save customs form data:', error)
      }
    }

    if (result && result.completionUrl) {
      openCompletionUrl(result.completionUrl)
    }

    yield put(actions.setStartCustomsSuccess())
  } catch (error) {
    console.error('Customs submission failed:', error)
    yield put(actions.setStartCustomsFailure((error as Error).message || 'Failed to send customs data'))
  }
}

export function* checkAvailability() {
  try {
    const idToken = yield call(getIdToken)
    const url = `https://europe-west1-${__FIREBASE_PROJECT_ID__}.cloudfunctions.net/api/customs/availability`
    const response = yield call(fetch, url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get customs availability: ${response.status} ${response.statusText}`)
    }

    const body = yield call([response, response.json])
    yield put(actions.setCustomsAvailability(!!(body && body.available)))
  } catch (e) {
    console.error('Failed to check customs availability', e)
    yield put(actions.setCustomsAvailability(false))
  }
}

export default function* sagas() {
  yield all([
    takeEvery(actions.START_CUSTOMS, startCustoms),
    takeEvery(actions.CHECK_CUSTOMS_AVAILABILITY, checkAvailability)
  ])
}
