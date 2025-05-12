import * as actions from './actions';
import reducer from '../../util/reducer';

const INITIAL_STATE = {
  initialized: false,
  authenticated: false,
  submitting: false,
  failure: false,
  emailAuthenticationCompletionFailure: false,
  guestAuthentication: {
    submitting: false,
    failure: false
  }
};

const ACTION_HANDLERS = {
  [actions.SET_SUBMITTING]: state => {
    return Object.assign({}, state, {
      submitting: true,
      failure: false,
    });
  },
  [actions.REQUEST_GUEST_TOKEN_AUTHENTICATION]: state => {
    return {
      ...state,
      guestAuthentication: {
        submitting: true,
        failure: false
      }
    }
  },
  [actions.GUEST_TOKEN_AUTHENTICATION_FAILURE]: state => {
    return {
      ...state,
      guestAuthentication: {
        submitting: false,
        failure: true
      }
    }
  },
  [actions.USERNAME_PASSWORD_AUTHENTICATION_FAILURE]: state => {
    return Object.assign({}, state, {
      submitting: false,
      failure: true,
    });
  },
  [actions.IP_AUTHENTICATION_FAILURE]: state => {
    return Object.assign({}, state, {
      initialized: true,
    });
  },
  [actions.FIREBASE_AUTHENTICATION_EVENT]: (state, action) => {
    if (action.payload.authData) {
      return {
        initialized: true,
        authenticated: true,
        failure: false,
        submitting: false,
        data: action.payload.authData,
        guestAuthentication: INITIAL_STATE.guestAuthentication
      };
    }
    return INITIAL_STATE;
  },
  [actions.EMAIL_AUTHENTICATION_COMPLETION_FAILURE]: state => {
    return {
      ...state,
      submitting: false,
      emailAuthenticationCompletionFailure: true
    }
  },
};

export default reducer(INITIAL_STATE, ACTION_HANDLERS);
