import {all, call, put, takeEvery} from 'redux-saga/effects';
import * as actions from './actions';
import {getIdToken} from '../../util/firebase'
import * as remote from '../movements/remote'

// The customs payload is built server-side from the stored movement (see
// functions/api/customs/buildCustomsPayload). The client only sends a reference
// to the movement, so it cannot inject arbitrary content into the trusted
// customs integration.
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
  // Defense in depth: only ever navigate to an https URL. The stored
  // customsFormUrl is constrained to the customs baseUrl by the database
  // rules, but this also guards values stored before that rule and blocks
  // dangerous schemes (javascript:, data:, http:).
  let parsed
  try {
    parsed = new URL(url)
  } catch (e) {
    console.warn('Refusing to open invalid completion URL')
    return
  }
  if (parsed.protocol !== 'https:') {
    console.warn('Refusing to open non-https completion URL')
    return
  }
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
    const result = yield call(postPrepopulatedFormToCustoms, {
      movementType: movementData.type,
      movementKey: movementData.key,
    })

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
