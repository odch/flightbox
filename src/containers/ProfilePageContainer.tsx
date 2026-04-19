import {connect} from 'react-redux';
import {loadProfile, saveProfile, addAircraft, updateAircraft, removeAircraft} from '../modules/profile';
import {loadPasskeys, registerPasskey, removePasskey} from '../modules/auth';
import ProfilePage from '../components/ProfilePage';
import {RootState} from '../modules';

const mapStateToProps = (state: RootState) => ({
  profile: state.profile.profile,
  saving: state.profile.saving,
  passkeysEnabled: __CONF__.passkeysEnabled === true,
  passkeys: (state.auth && state.auth.passkeys) || [],
  passkeyRegistrationSubmitting: (state.auth && state.auth.passkeyRegistration && state.auth.passkeyRegistration.submitting) || false,
  passkeyRegistrationFailure: (state.auth && state.auth.passkeyRegistration && state.auth.passkeyRegistration.failure) || false,
  passkeyRegistrationErrorMessage: state.auth && state.auth.passkeyRegistration && state.auth.passkeyRegistration.errorMessage,
  passkeyRemovalFailure: (state.auth && state.auth.passkeyRemoval && state.auth.passkeyRemoval.failure) || false,
  passkeyRemovalErrorMessage: state.auth && state.auth.passkeyRemoval && state.auth.passkeyRemoval.errorMessage,
});

const mapActionCreators = {
  loadProfile,
  saveProfile,
  addAircraft,
  updateAircraft,
  removeAircraft,
  loadPasskeys,
  registerPasskey,
  removePasskey,
};

export default connect(mapStateToProps, mapActionCreators)(ProfilePage);
